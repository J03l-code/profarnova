const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// PUBLIC: Create order from website (no auth required)
router.post('/website', async (req, res) => {
  const { client_name, client_phone, client_email, items, shipping_city, shipping_address, shipping_reference, notes, total_amount } = req.body;

  if (!client_name || !client_phone || !items || !shipping_address) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  try {
    const orderId = crypto.randomUUID();
    const shippingFull = `${shipping_city} - ${shipping_address}${shipping_reference ? ' (' + shipping_reference + ')' : ''}`;

    await db.query(
      `INSERT INTO orders (id, user_id, total_amount, status, shipping_address, client_name, client_phone, client_email, items_detail, notes, created_at, updated_at)
       VALUES (?, NULL, ?, 'pendiente', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [orderId, parseFloat(total_amount) || 0, shippingFull, client_name, client_phone, client_email || '', JSON.stringify(items), notes || '']
    );

    const result = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    res.status(201).json({ message: 'Pedido registrado.', order: result.rows[0] });
  } catch (err) {
    console.error('Error creating website order:', err.message);
    res.status(500).json({ error: 'Error al registrar el pedido.' });
  }
});

// GET GLOBAL ORDER HISTORY (Admin Only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT o.id, o.total_amount, o.status, o.shipping_address, o.created_at, o.updated_at,
             o.client_name, o.client_phone, o.client_email, o.items_detail, o.notes,
             COALESCE(o.client_name, u.full_name) as client_name,
             COALESCE(o.client_email, u.email) as client_email,
             COALESCE(o.client_phone, u.phone) as client_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching global orders:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET CURRENT USER'S ORDER HISTORY (Client / Authenticated)
router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, total_amount, status, shipping_address, created_at, updated_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// CREATE ORDER / CHECKOUT (Client / Authenticated)
router.post('/', verifyToken, async (req, res) => {
  const { items, shipping_address } = req.body; // items: [{ product_id, quantity }]

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Debe incluir al menos un producto en el pedido.' });
  }

  // Get dynamic MySQL connection for transaction integrity
  const connection = await db.pool.getConnection();

  try {
    await connection.beginTransaction();

    let totalAmount = 0;
    const itemsWithPrices = [];
    const addressToUse = shipping_address || req.user.shipping_address;

    if (!addressToUse) {
      throw new Error('Dirección de envío no especificada.');
    }

    // Process and validate items
    for (const item of items) {
      const [productRows] = await connection.query(
        'SELECT id, name, price, stock FROM products WHERE id = ?',
        [item.product_id]
      );

      if (productRows.length === 0) {
        throw new Error(`Producto con ID ${item.product_id} no existe.`);
      }

      const product = productRows[0];

      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para el producto "${product.name}". Stock disponible: ${product.stock}`);
      }

      const itemCost = Number(product.price) * item.quantity;
      totalAmount += itemCost;

      itemsWithPrices.push({
        product_id: product.id,
        quantity: item.quantity,
        price: product.price
      });

      // Deduct stock
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, product.id]
      );
    }

    // Generate Order UUID in Node.js
    const orderId = crypto.randomUUID();

    // Insert Order
    await connection.query(
      `INSERT INTO orders (id, user_id, total_amount, status, shipping_address)
       VALUES (?, ?, ?, 'pendiente', ?)`,
      [orderId, req.user.id, totalAmount, addressToUse]
    );

    // Retrieve order row to return
    const [orderRes] = await connection.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const newOrder = orderRes[0];

    // Insert Order Items
    for (const item of itemsWithPrices) {
      const orderItemId = crypto.randomUUID();
      await connection.query(
        `INSERT INTO order_items (id, order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
         [orderItemId, orderId, item.product_id, item.quantity, item.price]
      );
    }

    await connection.commit();
    res.status(201).json({
      message: 'Pedido realizado con éxito.',
      order: newOrder
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error during checkout transaction:', err.message);
    res.status(400).json({ error: err.message || 'Error al procesar el pedido.' });
  } finally {
    connection.release();
  }
});

// UPDATE ORDER STATUS (Admin Only)
router.put('/:id/status', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pendiente', 'empaquetado', 'enviado', 'entregado'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado de pedido no válido.' });
  }

  try {
    const checkOrder = await db.query('SELECT id FROM orders WHERE id = ?', [id]);
    if (checkOrder.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    await db.query(
      `UPDATE orders
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, id]
    );

    const result = await db.query('SELECT * FROM orders WHERE id = ?', [id]);

    res.json({
      message: 'Estado del pedido actualizado exitosamente.',
      order: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// DELETE ORDER (Admin Only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const checkOrder = await db.query('SELECT id FROM orders WHERE id = ?', [id]);
    if (checkOrder.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }
    
    // Also delete order_items if they exist for this order
    await db.query('DELETE FROM order_items WHERE order_id = ?', [id]);
    await db.query('DELETE FROM orders WHERE id = ?', [id]);
    
    res.json({ message: 'Pedido eliminado exitosamente.' });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
