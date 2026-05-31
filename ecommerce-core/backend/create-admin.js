/**
 * PROFARNOVA - Script de creación de usuario Administrador
 * Ejecutar UNA SOLA VEZ desde el servidor:
 *   node ecommerce-core/backend/create-admin.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./config/db');

const ADMIN = {
  full_name:        'Administrador Profarnova',
  email:            'admin@profarnova.com',
  phone:            '+593 9 8878 1166',
  shipping_address: 'Av. De la República E2-214, Quito, Ecuador',
  password:         'Profarnova2026!',
  role:             'administrador'
};

async function createAdmin() {
  try {
    // Verificar si ya existe
    const existing = await db.query('SELECT id FROM users WHERE email = ?', [ADMIN.email]);
    if (existing.rows.length > 0) {
      console.log(`\n⚠️  El administrador ya existe: ${ADMIN.email}`);
      console.log('   Si olvidaste la contraseña, elimina el usuario y ejecuta este script nuevamente.\n');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(ADMIN.password, salt);
    const id = crypto.randomUUID();

    await db.query(
      `INSERT INTO users (id, full_name, email, phone, shipping_address, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?, ?, 'administrador', 'activo')`,
      [id, ADMIN.full_name, ADMIN.email, ADMIN.phone, ADMIN.shipping_address, password_hash]
    );

    console.log('\n✅ Administrador creado exitosamente.\n');
    console.log('   ┌─────────────────────────────────────────┐');
    console.log(`   │  Email:      ${ADMIN.email}   │`);
    console.log(`   │  Contraseña: ${ADMIN.password}           │`);
    console.log('   └─────────────────────────────────────────┘');
    console.log('\n   🔐 Guarda estas credenciales en un lugar seguro.\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error al crear administrador:', err.message);
    process.exit(1);
  }
}

createAdmin();
