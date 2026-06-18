const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET /api/farmacias - Público: listar farmacias activas
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, nombre, ciudad, direccion, telefono, whatsapp, horario, productos, maps, activa
       FROM farmacias WHERE activa = 1 ORDER BY ciudad, nombre`
    );
    const farmacias = result.rows.map(f => ({
      ...f,
      productos: JSON.parse(f.productos || '[]')
    }));
    res.json(farmacias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/farmacias/admin - Admin: listar todas (activas e inactivas)
router.get('/admin', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM farmacias ORDER BY ciudad, nombre'
    );
    const farmacias = result.rows.map(f => ({
      ...f,
      productos: JSON.parse(f.productos || '[]')
    }));
    res.json(farmacias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/farmacias - Admin: crear farmacia
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { nombre, ciudad, direccion, telefono, whatsapp, horario, productos, maps } = req.body;
  if (!nombre || !ciudad || !direccion || !telefono) {
    return res.status(400).json({ error: 'Nombre, ciudad, dirección y teléfono son requeridos.' });
  }
  try {
    const id = crypto.randomUUID();
    const productosJson = JSON.stringify(Array.isArray(productos) ? productos : []);
    await db.query(
      `INSERT INTO farmacias (id, nombre, ciudad, direccion, telefono, whatsapp, horario, productos, maps, activa)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [id, nombre, ciudad.toLowerCase(), direccion, telefono, whatsapp || '', horario || '', productosJson, maps || '']
    );
    res.status(201).json({ success: true, id, message: 'Farmacia creada exitosamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/farmacias/:id - Admin: actualizar farmacia
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre, ciudad, direccion, telefono, whatsapp, horario, productos, maps, activa } = req.body;
  try {
    const productosJson = JSON.stringify(Array.isArray(productos) ? productos : []);
    await db.query(
      `UPDATE farmacias SET nombre=?, ciudad=?, direccion=?, telefono=?, whatsapp=?, horario=?, productos=?, maps=?, activa=?
       WHERE id=?`,
      [nombre, ciudad.toLowerCase(), direccion, telefono, whatsapp || '', horario || '', productosJson, maps || '', activa ? 1 : 0, id]
    );
    res.json({ success: true, message: 'Farmacia actualizada.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/farmacias/:id - Admin: eliminar farmacia
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM farmacias WHERE id = ?', [id]);
    res.json({ success: true, message: 'Farmacia eliminada.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
