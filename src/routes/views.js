const express = require('express');
const router = express.Router();
const productManager = require('../utils/productManager');

router.get('/', (req, res) => {
  const products = productManager.getProducts();
  res.render('home', { products, title: 'Home' });
});

router.get('/realtimeproducts', (req, res) => {
  const products = productManager.getProducts();
  res.render('realTimeProducts', { products, title: 'Real Time Products' });
});

module.exports = router;

