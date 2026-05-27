const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool optimized for cPanel/MySQL environments
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'profarnova_ecommerce',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Emulate PostgreSQL pool connection logs
pool.getConnection()
  .then((conn) => {
    console.log('Successfully connected to the MySQL/MariaDB database.');
    conn.release();
  })
  .catch((err) => {
    console.error('Error connecting to MySQL/MariaDB database:', err.message);
  });

module.exports = {
  // Query helper emulating PostgreSQL's { rows } return structure
  query: async (text, params) => {
    const [rows] = await pool.query(text, params);
    return { rows };
  },
  pool
};
