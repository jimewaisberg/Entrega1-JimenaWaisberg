/**
 * Views Router
 * Maneja las vistas de la aplicación
 */
const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const productService = require('../services/product.service');
const cartService = require('../services/cart.service');
const UserDTO = require('../dto/user.dto');

const JWT_SECRET = process.env.JWT_SECRET || 'coderhouse_secret_key_jwt_2024';

// Middleware para verificar si el usuario está autenticado
const isAuthenticated = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect('/login');
    }
    req.user = user;
    next();
  })(req, res, next);
};

// Middleware para redirigir usuarios ya autenticados
const isNotAuthenticated = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) {
      return res.redirect('/products');
    }
    next();
  })(req, res, next);
};

// Middleware para obtener usuario si está autenticado (opcional)
const optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (!err && user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

// GET /login
router.get('/login', isNotAuthenticated, (req, res) => {
  const error = req.query.error;
  res.render('login', { error, title: 'Login' });
});

// GET /register
router.get('/register', isNotAuthenticated, (req, res) => {
  const error = req.query.error;
  res.render('register', { error, title: 'Registro' });
});

// GET /forgot-password
router.get('/forgot-password', isNotAuthenticated, (req, res) => {
  res.render('forgot-password', { title: 'Recuperar Contraseña' });
});

// GET /reset-password/:token
router.get('/reset-password/:token', (req, res) => {
  const { token } = req.params;
  
  // Verificar si el token es válido
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'password_reset') {
      return res.render('reset-password', { expired: true, title: 'Enlace Expirado' });
    }
    res.render('reset-password', { token, expired: false, title: 'Nueva Contraseña' });
  } catch (err) {
    res.render('reset-password', { expired: true, title: 'Enlace Expirado' });
  }
});

// GET /profile
router.get('/profile', isAuthenticated, (req, res) => {
  const userDTO = new UserDTO(req.user);
  res.render('profile', { user: userDTO, title: 'Mi Perfil' });
});

// GET /
router.get('/', optionalAuth, async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    const user = req.user ? new UserDTO(req.user) : null;
    res.render('home', { products, user, title: 'Home' });
  } catch (error) {
    console.error('Error en GET /:', error);
    res.status(500).render('error', { message: 'Error al cargar productos', title: 'Error' });
  }
});

// GET /realtimeproducts
router.get('/realtimeproducts', optionalAuth, async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    const user = req.user ? new UserDTO(req.user) : null;
    res.render('realTimeProducts', { products, user, title: 'Real Time Products' });
  } catch (error) {
    console.error('Error en GET /realtimeproducts:', error);
    res.status(500).render('error', { message: 'Error al cargar productos', title: 'Error' });
  }
});

// GET /products
router.get('/products', optionalAuth, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const sort = req.query.sort || null;
    const query = req.query.query || null;

    const result = await productService.getProductsPaginated({
      limit,
      page,
      sort,
      query
    });

    const { products, pagination } = result;
    const user = req.user ? new UserDTO(req.user) : null;

    const baseUrl = `${req.protocol}://${req.get('host')}/products`;
    const buildLink = (pageNum) => {
      const params = new URLSearchParams();
      if (limit !== 10) params.append('limit', limit);
      if (pageNum !== 1) params.append('page', pageNum);
      if (sort) params.append('sort', sort);
      if (query) params.append('query', query);
      const queryString = params.toString();
      return queryString ? `${baseUrl}?${queryString}` : baseUrl;
    };

    res.render('products/index', {
      products: products || [],
      pagination: {
        ...pagination,
        prevLink: pagination.hasPrevPage ? buildLink(pagination.prevPage) : null,
        nextLink: pagination.hasNextPage ? buildLink(pagination.nextPage) : null
      },
      currentLimit: limit,
      currentSort: sort,
      currentQuery: query,
      user,
      title: 'Productos'
    });
  } catch (error) {
    console.error('Error en GET /products:', error);
    res.status(500).render('error', { message: 'Error al cargar productos', title: 'Error' });
  }
});

// GET /products/:pid
router.get('/products/:pid', optionalAuth, async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.pid);
    if (!product) {
      return res.status(404).render('error', { 
        message: 'Producto no encontrado', 
        title: 'Error 404' 
      });
    }
    const user = req.user ? new UserDTO(req.user) : null;
    res.render('products/detail', { product, user, title: product.title });
  } catch (error) {
    console.error('Error en GET /products/:pid:', error);
    res.status(500).render('error', { message: 'Error al cargar producto', title: 'Error' });
  }
});

// GET /carts/:cid
router.get('/carts/:cid', optionalAuth, async (req, res) => {
  try {
    const cart = await cartService.getCartByIdPopulated(req.params.cid);
    if (!cart) {
      return res.status(404).render('error', { 
        message: 'Carrito no encontrado', 
        title: 'Error 404' 
      });
    }
    const user = req.user ? new UserDTO(req.user) : null;
    res.render('carts/detail', { cart, user, title: 'Carrito' });
  } catch (error) {
    console.error('Error en GET /carts/:cid:', error);
    res.status(500).render('error', { message: 'Error al cargar carrito', title: 'Error' });
  }
});

module.exports = router;
