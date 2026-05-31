const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Multer Config for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('El archivo no es una imagen válida'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET ALL PRODUCTS (Public)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    
    // Add dynamic critical stock field for frontend convenience
    const products = result.rows.map(product => ({
      ...product,
      is_critical_stock: product.stock < 5
    }));
    
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET SINGLE PRODUCT (Public)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    
    const product = result.rows[0];
    res.json({
      ...product,
      is_critical_stock: product.stock < 5
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// CREATE PRODUCT (Admin Only)
router.post('/', verifyToken, isAdmin, upload.single('image'), async (req, res) => {
  const { name, category, description, price, stock, sku, composition, indications, mechanism_of_action, benefits } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url || null;

  // Validation
  if (!name || !category || !price || stock === undefined || !sku) {
    return res.status(400).json({ error: 'Nombre, Categoría, Precio, Stock y SKU son obligatorios.' });
  }

  try {
    // Check if SKU is unique
    const skuExist = await db.query('SELECT id FROM products WHERE sku = ?', [sku]);
    if (skuExist.rows.length > 0) {
      return res.status(400).json({ error: 'El código de barras / SKU ya está en uso.' });
    }

    // Generate UUID inside Node.js for cPanel compatibility
    const productId = crypto.randomUUID();

    await db.query(
      `INSERT INTO products (id, name, category, description, price, stock, sku, image_url, composition, indications, mechanism_of_action, benefits)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, name, category, description || '', price, stock, sku, image_url, composition || null, indications || null, mechanism_of_action || null, benefits || null]
    );

    const result = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    const newProduct = result.rows[0];
    
    res.status(201).json({
      message: 'Producto creado exitosamente.',
      product: {
        ...newProduct,
        is_critical_stock: newProduct.stock < 5
      }
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// UPDATE PRODUCT (Admin Only)
router.put('/:id', verifyToken, isAdmin, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, category, description, price, stock, sku, composition, indications, mechanism_of_action, benefits } = req.body;
  
  try {
    // Get existing product
    const productQuery = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (productQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    const currentProduct = productQuery.rows[0];

    // Check SKU if changing
    if (sku && sku !== currentProduct.sku) {
      const skuExist = await db.query('SELECT id FROM products WHERE sku = ? AND id != ?', [sku, id]);
      if (skuExist.rows.length > 0) {
        return res.status(400).json({ error: 'El código de barras / SKU ya está en uso por otro producto.' });
      }
    }

    const updatedName = name || currentProduct.name;
    const updatedCategory = category || currentProduct.category;
    const updatedDescription = description !== undefined ? description : currentProduct.description;
    const updatedPrice = price !== undefined ? price : currentProduct.price;
    const updatedStock = stock !== undefined ? stock : currentProduct.stock;
    const updatedSku = sku || currentProduct.sku;
    const updatedImageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.image_url || currentProduct.image_url;
    const updatedComposition = composition !== undefined ? composition : currentProduct.composition;
    const updatedIndications = indications !== undefined ? indications : currentProduct.indications;
    const updatedMechanism = mechanism_of_action !== undefined ? mechanism_of_action : currentProduct.mechanism_of_action;
    const updatedBenefits = benefits !== undefined ? benefits : currentProduct.benefits;

    await db.query(
      `UPDATE products 
       SET name = ?, category = ?, description = ?, price = ?, stock = ?, sku = ?, image_url = ?,
           composition = ?, indications = ?, mechanism_of_action = ?, benefits = ?
       WHERE id = ?`,
      [updatedName, updatedCategory, updatedDescription, updatedPrice, updatedStock, updatedSku, updatedImageUrl,
       updatedComposition, updatedIndications, updatedMechanism, updatedBenefits, id]
    );

    const result = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    const updatedProduct = result.rows[0];
    
    res.json({
      message: 'Producto actualizado exitosamente.',
      product: {
        ...updatedProduct,
        is_critical_stock: updatedProduct.stock < 5
      }
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// DELETE PRODUCT (Admin Only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const checkProduct = await db.query('SELECT id FROM products WHERE id = ?', [id]);
    if (checkProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Producto eliminado exitosamente.' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
