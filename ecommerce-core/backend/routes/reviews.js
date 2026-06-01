const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET APPROVED REVIEWS FOR A SKU (Public)
router.get('/product/:sku', async (req, res) => {
  const { sku } = req.params;
  try {
    const result = await db.query(
      `SELECT id, product_sku, client_name, rating, comment, created_at 
       FROM reviews 
       WHERE product_sku = ? AND status = 'approved'
       ORDER BY created_at DESC`,
      [sku]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching approved reviews:', err);
    res.status(500).json({ error: 'Error al obtener las reseñas.' });
  }
});

// SUBMIT A NEW REVIEW (Public)
router.post('/', async (req, res) => {
  const { product_sku, client_name, client_email, rating, comment } = req.body;

  if (!product_sku || !client_name || !rating || !comment) {
    return res.status(400).json({ error: 'Producto, Nombre, Calificación y Comentario son obligatorios.' });
  }

  const numRating = parseInt(rating, 10);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'La calificación debe ser entre 1 y 5 estrellas.' });
  }

  try {
    const id = crypto.randomUUID();
    await db.query(
      `INSERT INTO reviews (id, product_sku, client_name, client_email, rating, comment, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [id, product_sku, client_name, client_email || null, numRating, comment]
    );

    res.status(201).json({
      message: 'Tu reseña ha sido enviada con éxito y está pendiente de aprobación.',
      review: { id, product_sku, client_name, rating: numRating, comment, status: 'pending' }
    });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ error: 'Error interno del servidor al enviar la reseña.' });
  }
});

// GET ALL REVIEWS (Admin Only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM reviews ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all reviews:', err);
    res.status(500).json({ error: 'Error al obtener el listado de reseñas.' });
  }
});

// UPDATE REVIEW STATUS (Admin Only)
router.put('/:id/status', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'approved', 'rejected'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado de reseña no válido.' });
  }

  try {
    const check = await db.query('SELECT id FROM reviews WHERE id = ?', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Reseña no encontrada.' });
    }

    await db.query(
      'UPDATE reviews SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ message: `Reseña ${status === 'approved' ? 'aprobada' : (status === 'rejected' ? 'rechazada' : 'puesta en pendiente')} con éxito.` });
  } catch (err) {
    console.error('Error updating review status:', err);
    res.status(500).json({ error: 'Error al actualizar el estado de la reseña.' });
  }
});

// DELETE REVIEW (Admin Only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const check = await db.query('SELECT id FROM reviews WHERE id = ?', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Reseña no encontrada.' });
    }

    await db.query('DELETE FROM reviews WHERE id = ?', [id]);
    res.json({ message: 'Reseña eliminada permanentemente.' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Error al eliminar la reseña.' });
  }
});

module.exports = router;
