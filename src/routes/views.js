const express = require('express');
const router = express.Router();
const productManager = require('../utils/productManager');
const Cart = require('../models/Cart');

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
    res.render('products/detail', { product, title: product.title });
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
