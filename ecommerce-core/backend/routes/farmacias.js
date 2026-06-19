const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// GET /api/farmacias - Público: listar farmacias activas
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, nombre, ciudad, sector, direccion, telefono, whatsapp, horario, productos, maps, logo, activa
       FROM farmacias WHERE activa = 1 ORDER BY ciudad, sector, nombre`
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
      'SELECT * FROM farmacias ORDER BY ciudad, sector, nombre'
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
router.post('/', verifyToken, isAdmin, upload.single('logo_file'), async (req, res) => {
  const { nombre, ciudad, sector, direccion, telefono, whatsapp, horario, productos, maps } = req.body;
  let logo = req.body.logo || '';
  if (req.file) {
    logo = '/uploads/' + req.file.filename;
  }

  if (!nombre || !ciudad || !direccion || !telefono) {
    return res.status(400).json({ error: 'Nombre, ciudad, dirección y teléfono son requeridos.' });
  }
  try {
    const id = crypto.randomUUID();
    let productosParsed = [];
    if (typeof productos === 'string') {
      try { productosParsed = JSON.parse(productos); } catch (e) { productosParsed = productos.split(','); }
    } else if (Array.isArray(productos)) {
      productosParsed = productos;
    }
    const productosJson = JSON.stringify(productosParsed);

    await db.query(
      `INSERT INTO farmacias (id, nombre, ciudad, sector, direccion, telefono, whatsapp, horario, productos, maps, logo, activa)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [id, nombre, ciudad.toLowerCase(), sector || '', direccion, telefono, whatsapp || '', horario || '', productosJson, maps || '', logo]
    );
    res.status(201).json({ success: true, id, message: 'Farmacia creada exitosamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/farmacias/:id - Admin: actualizar farmacia
router.put('/:id', verifyToken, isAdmin, upload.single('logo_file'), async (req, res) => {
  const { id } = req.params;
  const { nombre, ciudad, sector, direccion, telefono, whatsapp, horario, productos, maps, activa } = req.body;
  let logo = req.body.logo || '';
  if (req.file) {
    logo = '/uploads/' + req.file.filename;
  }

  try {
    let productosParsed = [];
    if (typeof productos === 'string') {
      try { productosParsed = JSON.parse(productos); } catch (e) { productosParsed = productos.split(','); }
    } else if (Array.isArray(productos)) {
      productosParsed = productos;
    }
    const productosJson = JSON.stringify(productosParsed);

    if (logo || req.file) {
       await db.query(
        `UPDATE farmacias SET nombre=?, ciudad=?, sector=?, direccion=?, telefono=?, whatsapp=?, horario=?, productos=?, maps=?, logo=?, activa=?
         WHERE id=?`,
        [nombre, ciudad.toLowerCase(), sector || '', direccion, telefono, whatsapp || '', horario || '', productosJson, maps || '', logo, (activa === 'true' || activa === true || activa === 1 || activa === '1') ? 1 : 0, id]
      );
    } else {
       await db.query(
        `UPDATE farmacias SET nombre=?, ciudad=?, sector=?, direccion=?, telefono=?, whatsapp=?, horario=?, productos=?, maps=?, activa=?
         WHERE id=?`,
        [nombre, ciudad.toLowerCase(), sector || '', direccion, telefono, whatsapp || '', horario || '', productosJson, maps || '', (activa === 'true' || activa === true || activa === 1 || activa === '1') ? 1 : 0, id]
      );
    }
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
