const express = require('express');
const router = express.Router();
const passport = require('passport');
const productManager = require('../utils/productManager');
const Cart = require('../models/Cart');

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

// GET /login - vista de login
router.get('/login', isNotAuthenticated, (req, res) => {
  const error = req.query.error;
  res.render('login', { error, title: 'Login' });
});

// GET /register - vista de registro
router.get('/register', isNotAuthenticated, (req, res) => {
  const error = req.query.error;
  res.render('register', { error, title: 'Registro' });
});

// GET /profile - vista del perfil del usuario (protegida)
router.get('/profile', isAuthenticated, (req, res) => {
  res.render('profile', { user: req.user, title: 'Mi Perfil' });
});

router.get('/', async (req, res) => {
  try {
    const products = await productManager.getProducts();
    res.render('home', { products, title: 'Home' });
  } catch (error) {
    console.error('Error en GET /:', error);
    res.status(500).render('error', { message: 'Error al cargar productos', title: 'Error' });
  }
});

router.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await productManager.getProducts();
    res.render('realTimeProducts', { products, title: 'Real Time Products' });
  } catch (error) {
    console.error('Error en GET /realtimeproducts:', error);
    res.status(500).render('error', { message: 'Error al cargar productos', title: 'Error' });
  }
});

// GET /products - vista de productos con paginación
router.get('/products', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const sort = req.query.sort || null;
    const query = req.query.query || null;

    const result = await productManager.getProductsPaginated({
      limit,
      page,
      sort,
      query
    });

    const { products, pagination } = result;

    // Construir URLs base para links
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

    // Verificar si el usuario está autenticado para mostrar su info
    let user = null;
    passport.authenticate('jwt', { session: false }, (err, authenticatedUser) => {
      if (!err && authenticatedUser) {
        user = authenticatedUser;
      }
    })(req, res, () => {});

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

// GET /products/:pid - vista de detalle de producto
router.get('/products/:pid', async (req, res) => {
  try {
    const product = await productManager.getProductById(req.params.pid);
    if (!product) {
      return res.status(404).render('error', { 
        message: 'Producto no encontrado', 
        title: 'Error 404' 
      });
    }

    // Verificar si el usuario está autenticado
    let user = null;
    passport.authenticate('jwt', { session: false }, (err, authenticatedUser) => {
      if (!err && authenticatedUser) {
        user = authenticatedUser;
      }
    })(req, res, () => {});

    res.render('products/detail', { product, user, title: product.title });
  } catch (error) {
    console.error('Error en GET /products/:pid:', error);
    res.status(500).render('error', { message: 'Error al cargar producto', title: 'Error' });
  }
});

// GET /carts/:cid - vista de carrito
router.get('/carts/:cid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid).populate('products.product');
    if (!cart) {
      return res.status(404).render('error', { 
        message: 'Carrito no encontrado', 
        title: 'Error 404' 
      });
    }
    res.render('carts/detail', { cart, title: 'Carrito' });
  } catch (error) {
    console.error('Error en GET /carts/:cid:', error);
    res.status(500).render('error', { message: 'Error al cargar carrito', title: 'Error' });
  }
});

module.exports = router;
