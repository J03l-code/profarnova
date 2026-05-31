const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// 1. SEND CONTACT MESSAGE (Public - From Contact Form)
router.post('/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Los campos nombre, correo, asunto y mensaje son obligatorios.' });
  }

  try {
    const messageId = crypto.randomUUID();

    await db.query(
      `INSERT INTO messages (id, name, email, phone, subject, message, status)
       VALUES (?, ?, ?, ?, ?, ?, 'unread')`,
      [messageId, name, email, phone || null, subject, message]
    );

    res.status(201).json({
      success: true,
      message: 'Mensaje registrado exitosamente en el sistema.'
    });
  } catch (err) {
    console.error('Error saving contact message:', err);
    res.status(500).json({ error: 'Error interno del servidor al procesar el mensaje.' });
  }
});

// 2. GET ALL MESSAGES (Admin Only - Sorted by Date)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching contact messages:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// 3. MARK MESSAGE AS READ / UNREAD (Admin Only)
router.put('/:id/status', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // should be 'read' or 'unread'

  if (!['read', 'unread'].includes(status)) {
    return res.status(400).json({ error: "El estado debe ser 'read' o 'unread'." });
  }

  try {
    const checkMsg = await db.query('SELECT id FROM messages WHERE id = ?', [id]);
    if (checkMsg.rows.length === 0) {
      return res.status(404).json({ error: 'Mensaje no encontrado.' });
    }

    await db.query('UPDATE messages SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: 'Estado del mensaje actualizado.' });
  } catch (err) {
    console.error('Error updating message status:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// 4. DELETE MESSAGE (Admin Only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const checkMsg = await db.query('SELECT id FROM messages WHERE id = ?', [id]);
    if (checkMsg.rows.length === 0) {
      return res.status(404).json({ error: 'Mensaje no encontrado.' });
    }

    await db.query('DELETE FROM messages WHERE id = ?', [id]);
    res.json({ success: true, message: 'Mensaje eliminado exitosamente.' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
