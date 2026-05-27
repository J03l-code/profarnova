const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET WEB CONFIG (Public)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM web_config');
    const configData = {};
    result.rows.forEach(row => {
      configData[row.id] = row.config_value;
    });
    
    // Default configs if empty
    if (!configData.banners) {
      configData.banners = { main_banner: '/assets/hero-bg.jpg', promo_banner: '' };
    }
    if (!configData.contact) {
      configData.contact = { phone: '+593 9 8878 1166', email: 'info@profarnova.com', address: 'Quito, Ecuador' };
    }
    if (!configData.shipping) {
      configData.shipping = { base_fee: 5.00, free_shipping_threshold: 50.00, policy: 'Envíos a todo el país en 24-48 horas hábiles.' };
    }

    res.json(configData);
  } catch (err) {
    console.error('Error fetching web config:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// UPDATE WEB CONFIG (Admin Only)
router.put('/', verifyToken, isAdmin, async (req, res) => {
  const { key, value } = req.body; // e.g. key = 'banners', value = { main_banner: '...', promo_banner: '...' }

  const validKeys = ['banners', 'contact', 'shipping'];
  if (!key || !validKeys.includes(key) || !value) {
    return res.status(400).json({ error: 'Llave de configuración inválida o valor no proporcionado.' });
  }

  try {
    const valueString = JSON.stringify(value);
    
    // UPSERT config for MySQL/MariaDB
    await db.query(
      `INSERT INTO web_config (id, config_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE config_value = ?`,
      [key, valueString, valueString]
    );

    const result = await db.query('SELECT * FROM web_config WHERE id = ?', [key]);

    res.json({
      message: `Configuración de '${key}' actualizada exitosamente.`,
      config: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating web config:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
