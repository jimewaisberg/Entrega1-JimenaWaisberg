/**
 * Middleware de Autorización
 * Controla el acceso a endpoints según el rol del usuario
 * Trabaja junto con la estrategia "current" de Passport
 */
const passport = require('passport');

/**
 * Middleware que verifica autenticación usando la estrategia "current"
 * La estrategia "current" busca al usuario en la BD y devuelve datos actualizados
 */
const passportCall = (strategy) => {
  return (req, res, next) => {
    passport.authenticate(strategy, { session: false }, (err, user, info) => {
      if (err) {
        return res.status(500).json({ status: 'error', message: 'Error de autenticación' });
      }
      if (!user) {
        return res.status(401).json({ 
          status: 'error', 
          message: info?.message || 'No autorizado - Token inválido o inexistente' 
        });
      }
      req.user = user;
      next();
    })(req, res, next);
  };
};

/**
 * Middleware de autenticación usando estrategia "current"
 * Obtiene usuario actualizado de la base de datos
 */
const authenticateCurrent = passportCall('current');

/**
 * Middleware que verifica si el usuario tiene rol de administrador
 * Solo admin puede: crear, actualizar y eliminar productos
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'No autorizado' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Acceso denegado - Se requiere rol de administrador' 
    });
  }
  
  next();
};

/**
 * Middleware que verifica si el usuario tiene rol de usuario regular
 * Solo user puede: agregar productos al carrito
 */
const isUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'No autorizado' });
  }
  
  if (req.user.role !== 'user') {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Acceso denegado - Esta acción es solo para usuarios' 
    });
  }
  
  next();
};

/**
 * Middleware genérico que autoriza múltiples roles
 * @param {Array} roles - Array de roles permitidos
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autorizado' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        status: 'error', 
        message: `Acceso denegado - Se requiere uno de los siguientes roles: ${roles.join(', ')}` 
      });
    }
    
    next();
  };
};

/**
 * Middleware que verifica que el carrito pertenece al usuario
 */
const isCartOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'No autorizado' });
  }
  
  const cartId = req.params.cid;
  const userCartId = req.user.cart ? req.user.cart.toString() : null;
  
  // Admins pueden acceder a cualquier carrito
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Usuarios solo pueden acceder a su propio carrito
  if (userCartId !== cartId) {
    return res.status(403).json({ 
      status: 'error', 
      message: 'Acceso denegado - Solo puedes acceder a tu propio carrito' 
    });
  }
  
  next();
};

module.exports = {
  passportCall,
  authenticateCurrent,
  isAdmin,
  isUser,
  authorize,
  isCartOwner
};
