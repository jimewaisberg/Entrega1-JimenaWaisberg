/**
 * Configuración de Variables de Entorno
 * Carga y valida las variables de entorno
 */
require('dotenv').config();

const config = {
  // Servidor
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce',
  useInMemoryDB: process.env.USE_IN_MEMORY_DB === 'true',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'default_secret_key_change_in_production',
  jwtExpiresIn: '24h',
  jwtResetExpiresIn: '1h', // Para tokens de reset de contraseña

  // Email
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    service: 'gmail'
  },

  // URL Base
  baseUrl: process.env.BASE_URL || 'http://localhost:8080'
};

// Validar configuración crítica en producción
if (config.nodeEnv === 'production') {
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASS'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error(`ERROR: Variables de entorno faltantes: ${missing.join(', ')}`);
    process.exit(1);
  }
}

module.exports = config;

