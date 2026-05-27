const jwt = require('jsonwebtoken');

// Verify JWT token in requests
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'profarnova_secret_key');
    req.user = verified; // Contains id, email, role, status
    
    // Check if user account is active
    if (req.user.status === 'suspendido') {
      return res.status(403).json({ error: 'Esta cuenta ha sido suspendida por el administrador.' });
    }
    
    next();
  } catch (err) {
    res.status(400).json({ error: 'Token inválido o expirado.' });
  }
};

// Check if user is an Administrator
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
  }
  
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de Administrador.' });
  }
  
  next();
};

module.exports = {
  verifyToken,
  isAdmin
};
