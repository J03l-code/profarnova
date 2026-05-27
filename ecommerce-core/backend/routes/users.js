const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET ALL USERS/CLIENTS (Admin Only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    // Return all users who are clients, including their total orders count
    // Grouping by all selected users fields to prevent ONLY_FULL_GROUP_BY issues in MySQL/MariaDB
    const result = await db.query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.shipping_address, u.rfc, u.role, u.status, u.created_at,
             COUNT(o.id) as total_orders,
             COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'cliente'
      GROUP BY u.id, u.full_name, u.email, u.phone, u.shipping_address, u.rfc, u.role, u.status, u.created_at
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching clients list:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// TOGGLE CLIENT STATUS (Admin Only - Activate/Suspend)
router.put('/:id/status', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'activo' or 'suspendido'

  if (!status || !['activo', 'suspendido'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido. Debe ser activo o suspendido.' });
  }

  try {
    // Check if user exists and is a client
    const userRes = await db.query('SELECT id, role, full_name FROM users WHERE id = ?', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const user = userRes.rows[0];
    if (user.role === 'administrador') {
      return res.status(400).json({ error: 'No se puede modificar el estado de un administrador.' });
    }

    await db.query(
      `UPDATE users
       SET status = ?
       WHERE id = ?`,
      [status, id]
    );

    const result = await db.query(
      `SELECT id, full_name, email, role, status 
       FROM users WHERE id = ?`,
      [id]
    );

    res.json({
      message: `El estado del usuario ${user.full_name} se actualizó a ${status}.`,
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating user status:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
