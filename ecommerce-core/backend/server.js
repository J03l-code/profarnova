const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Route files
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const configRoutes = require('./routes/config');
const blogRoutes = require('./routes/blogs');
const messageRoutes = require('./routes/messages');
const reviewRoutes = require('./routes/reviews');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use('/uploads', express.static(uploadDir));

// Route bindings
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/config', configRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);

// Root endpoints to satisfy cPanel/Passenger availability checks
const welcomeHandler = (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send('<h1>PROFARNOVA API</h1><p>El servidor está funcionando correctamente.</p>');
};
app.get('/', welcomeHandler);
app.get('/api', welcomeHandler);

const db = require('./config/db');

// Health check endpoints
const healthHandler = async (req, res) => {
  try {
    // Perform a simple query to verify database connectivity
    await db.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      database: 'connected', 
      timestamp: new Date() 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected', 
      error: error.message,
      timestamp: new Date() 
    });
  }
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// ─── ONE-TIME SETUP: Create First Admin & Seed Products ───────────────────────
// Visit: https://profarnova.com/api/setup-admin?secret=ProfaNova_Setup_2026
// DELETE this block after first use!
app.get('/api/setup-admin', async (req, res) => {
  const SECRET = 'ProfaNova_Setup_2026';
  if (req.query.secret !== SECRET) {
    return res.status(403).json({ error: 'Clave secreta incorrecta.' });
  }
  try {
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');

    // 1. Seed/Create Administrator User
    const email = 'admin@profarnova.com';
    const password = 'Profarnova2026!';
    let userMessage = 'El administrador ya existe. Puedes iniciar sesión.';

    const existingUser = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.rows.length === 0) {
      const hash = await bcrypt.hash(password, 10);
      const id = crypto.randomUUID();
      await db.query(
        `INSERT INTO users (id, full_name, email, phone, shipping_address, password_hash, role, status)
         VALUES (?, 'Administrador Profarnova', ?, '+593 9 8878 1166', 'Quito, Ecuador', ?, 'administrador', 'activo')`,
        [id, email, hash]
      );
      userMessage = '✅ Administrador creado exitosamente.';
    }

    // 2. Seed/Insert Cysprex & Lubryn-E Products (Upsert using ON DUPLICATE KEY UPDATE)
    const productsToSeed = [
      {
        id: 'cysprex-prod-id',
        name: 'CYSPREX® Bienestar Urinario',
        category: 'Bienestar Urinario',
        description: 'Suplemento con Proantocianidinas 36mg. 15 cápsulas. Combina arándano rojo, vitamina C y resveratrol para proteger el tracto urinario de forma natural.',
        price: 28.80,
        stock: 50,
        sku: 'PRF-CYS-36',
        image_url: 'assets/Cysprex final.png',
        composition: 'Cada cápsula de 560mg contiene Extracto Seco de Arándano Rojo (Vaccinium macrocarpon) estandarizado en Proantocianidinas de tipo A (36mg), Vitamina C (Ácido Ascórbico) y Resveratrol.',
        indications: 'Indicado como coadyuvante y preventivo en personas propensas a infecciones recurrentes del tracto urinario (cistitis), fortalecimiento de las defensas y protección antioxidante celular.',
        mechanism_of_action: 'Las proantocianidinas de tipo A del arándano rojo se adhieren a los filamentos de la bacteria Escherichia coli, impidiendo que esta se fije a las células del urotelio y facilitando su eliminación por la orina. La Vitamina C acidifica la orina creando un ambiente hostil para las bacterias, y el Resveratrol actúa como potente antioxidante.',
        benefits: '• Prevención efectiva de infecciones recurrentes del tracto urinario (cistitis).\n• Reduce la adherencia bacteriana al tracto urinario.\n• Aporte de antioxidantes premium para la salud celular.\n• Fortalece el sistema inmunológico frente a agentes patógenos.'
      },
      {
        id: 'lubryne-prod-id',
        name: 'Lubryn-E® Gel Íntimo',
        category: 'Salud Femenina',
        description: 'Gel hidratante íntimo con Ácido Hialurónico. 60g. Coadyuvante en el alivio de la resequedad y el confort íntimo diario.',
        price: 20.99,
        stock: 35,
        sku: 'PRF-LUB-60',
        image_url: 'assets/lubrine.png',
        composition: 'Fórmula premium que combina Ácido Hialurónico (hidratante y regenerador activo), Vitamina E (antioxidante y protector barrera), Aloe Vera (calmante y antiinflamatorio natural) y Ácido Láctico (regulador y protector del pH vaginal fisiológico).',
        indications: 'Coadyuvante en el alivio y manejo de la sequedad íntima debida a menopausia, hipoestrogenismo, lactancia, postparto, anticonceptivos hormonales, estrés o agentes irritantes externos.',
        mechanism_of_action: 'Forma una película hidratante y protectora sobre el epitelio íntimo externo que devuelve la elasticidad, lubrica para facilitar las relaciones íntimas, calma la comezón o irritación y equilibra el pH vaginal a su rango ácido fisiológico.',
        benefits: '• Hidratación profunda y restauración de la elasticidad natural de la mucosa.\n• Alivio inmediato del prurito, la comezón y la irritación íntima.\n• Máximo confort y bienestar durante las relaciones íntimas.\n• Mantiene y defiende el equilibrio de la microbiota íntima (pH fisiológico).'
      }
    ];

    for (const p of productsToSeed) {
      await db.query(
        `INSERT INTO products (id, name, category, description, price, stock, sku, image_url, composition, indications, mechanism_of_action, benefits)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           category = VALUES(category),
           description = VALUES(description),
           price = VALUES(price),
           stock = VALUES(stock),
           sku = VALUES(sku),
           image_url = VALUES(image_url),
           composition = VALUES(composition),
           indications = VALUES(indications),
           mechanism_of_action = VALUES(mechanism_of_action),
           benefits = VALUES(benefits)`,
        [p.id, p.name, p.category, p.description, p.price, p.stock, p.sku, p.image_url, p.composition, p.indications, p.mechanism_of_action, p.benefits]
      );
    }

    res.json({
      status: 'success',
      admin_status: userMessage,
      products_seeded: productsToSeed.map(p => p.name),
      email,
      password,
      warning: '⚠️ Recuerda notificar para eliminar este endpoint de configuración temporal por seguridad.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Ocurrió un error inesperado en el servidor.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`PROFARNOVA API server is running on port ${PORT}`);
});
