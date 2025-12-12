const passport = require('passport');
const jwt = require('passport-jwt');
const User = require('../models/User');
const { JWT_SECRET } = require('../utils/jwt');

const JWTStrategy = jwt.Strategy;
const ExtractJWT = jwt.ExtractJwt;

/**
 * Extractor de JWT desde cookies
 * Busca el token en la cookie 'currentUser'
 */
const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['currentUser'];
  }
  return token;
};

/**
 * Inicializa las estrategias de Passport
 */
const initializePassport = () => {
  // Estrategia JWT - valida el token y extrae el usuario
  passport.use('jwt', new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
    secretOrKey: JWT_SECRET
  }, async (jwt_payload, done) => {
    try {
      // El payload ya contiene los datos del usuario
      return done(null, jwt_payload);
    } catch (error) {
      return done(error, false);
    }
  }));

  // Estrategia "current" - específica para el endpoint /api/sessions/current
  passport.use('current', new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
    secretOrKey: JWT_SECRET
  }, async (jwt_payload, done) => {
    try {
      // Buscar usuario en la base de datos para obtener datos actualizados
      const user = await User.findById(jwt_payload.id).select('-password');
      if (!user) {
        return done(null, false, { message: 'Usuario no encontrado' });
      }
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }));
};

module.exports = initializePassport;

