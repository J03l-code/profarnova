const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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
  .then(async (conn) => {
    console.log('Successfully connected to the MySQL/MariaDB database.');
    
    // Automatically initialize tables if not exist (e.g. blogs and messages tables)
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS blogs (
          id VARCHAR(36) PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          slug VARCHAR(200) UNIQUE NOT NULL,
          excerpt TEXT NULL,
          content TEXT NOT NULL,
          category VARCHAR(100) NULL,
          image_url TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('Blogs table verified/created successfully.');

      await conn.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          email VARCHAR(100) NOT NULL,
          phone VARCHAR(20) NULL,
          subject VARCHAR(150) NOT NULL,
          message TEXT NOT NULL,
          status ENUM('unread', 'read') DEFAULT 'unread',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('Messages table verified/created successfully.');
    } catch (tableErr) {
      console.error('Error verifying/creating tables:', tableErr.message);
    }

    // Safely add advanced columns to products table if they don't exist
    try { await conn.query('ALTER TABLE products ADD COLUMN composition TEXT NULL'); } catch (e) {}
    try { await conn.query('ALTER TABLE products ADD COLUMN indications TEXT NULL'); } catch (e) {}
    try { await conn.query('ALTER TABLE products ADD COLUMN mechanism_of_action TEXT NULL'); } catch (e) {}
    try { await conn.query('ALTER TABLE products ADD COLUMN benefits TEXT NULL'); } catch (e) {}
    
    // Safely add guest order columns to orders table if they don't exist
    try { await conn.query('ALTER TABLE orders ADD COLUMN client_name VARCHAR(150) NULL'); } catch (e) {}
    try { await conn.query('ALTER TABLE orders ADD COLUMN client_phone VARCHAR(30) NULL'); } catch (e) {}
    try { await conn.query('ALTER TABLE orders ADD COLUMN client_email VARCHAR(100) NULL'); } catch (e) {}
    try { await conn.query('ALTER TABLE orders ADD COLUMN items_detail TEXT NULL'); } catch (e) {}
    try { await conn.query('ALTER TABLE orders ADD COLUMN notes TEXT NULL'); } catch (e) {}
    
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
