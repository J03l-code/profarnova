const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// REGISTER CLIENT
router.post('/register', async (req, res) => {
  const { full_name, email, phone, shipping_address, rfc, password } = req.body;

  // Real-time backend validation
  if (!full_name || !email || !phone || !shipping_address || !password) {
    return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados.' });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Formato de correo electrónico inválido.' });
  }

  // Password strength validation (min 8 chars, 1 number, 1 letter)
  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return res.status(400).json({ 
      error: 'La contraseña debe tener al menos 8 caracteres y contener al menos una letra y un número.' 
    });
  }

  try {
    // Check if email already exists
    const userExist = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Generate UUID inside Node.js for cPanel compatibility
    const userId = crypto.randomUUID();

    // Save user to database
    await db.query(
      `INSERT INTO users (id, full_name, email, phone, shipping_address, rfc, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'cliente')`,
      [userId, full_name, email, phone, shipping_address, rfc || null, password_hash]
    );

    // Retrieve the registered user
    const newUserQuery = await db.query(
      `SELECT id, full_name, email, phone, shipping_address, rfc, role, status, created_at 
       FROM users WHERE id = ?`,
      [userId]
    );

    res.status(201).json({
      message: 'Registro exitoso.',
      user: newUserQuery.rows[0]
    });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// LOGIN (Client & Admin)
router.post('/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Correo electrónico y contraseña son requeridos.' });
  }

  try {
    // Query user
    const result = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    const user = result.rows[0];

    // Check status
    if (user.status === 'suspendido') {
      return res.status(403).json({ error: 'Esta cuenta ha sido suspendida por el administrador.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    // Token expiration based on "Remember Me"
    const expiresIn = rememberMe ? '30d' : '24h';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, status: user.status },
      process.env.JWT_SECRET || 'profarnova_secret_key',
      { expiresIn }
    );

    // Exclude password from response
    delete user.password_hash;

    res.json({
      message: 'Inicio de sesión exitoso.',
      token,
      user
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// PASSWORD RECOVERY
router.post('/recover-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El correo electrónico es requerido.' });
  }

  try {
    // Check if user exists
    const result = await db.query('SELECT id, full_name FROM users WHERE email = ?', [email]);
    if (result.rows.length === 0) {
      // For security, do not disclose if the email doesn't exist, say email sent anyway
      return res.json({ message: 'Si el correo está registrado, se enviarán instrucciones de recuperación.' });
    }

    const user = result.rows[0];
    
    // In a production app, here you would generate a unique token, save it to the DB, and send an email.
    // For now, we simulate this process.
    console.log(`[PASSWORD RECOVERY] Email recovery link sent to ${email} for user ${user.full_name}`);

    res.json({ message: 'Si el correo está registrado, se enviarán instrucciones de recuperación.' });
  } catch (err) {
    console.error('Error during password recovery:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET CURRENT USER FROM TOKEN
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, full_name, email, phone, shipping_address, rfc, role, status, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error retrieving current user:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
