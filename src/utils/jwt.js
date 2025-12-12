const jwt = require('jsonwebtoken');

// Clave secreta para firmar tokens (en producción usar variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'coderhouse_secret_key_jwt_2024';

/**
 * Genera un token JWT para el usuario
 * @param {Object} user - Usuario para generar el token
 * @returns {String} Token JWT
 */
const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    age: user.age,
    role: user.role,
    cart: user.cart
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

/**
 * Verifica y decodifica un token JWT
 * @param {String} token - Token a verificar
 * @returns {Object} Payload decodificado
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET
};

