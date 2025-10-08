
const express = require('express');
const router = express.Router();
const productManager = require('../utils/productManager');

module.exports = (io) => {
  
  router.get('/', (req, res) => {
    const products = productManager.getProducts();
    let limit = req.query.limit ? parseInt(req.query.limit) : products.length;
    res.send(products.slice(0, limit));
  });

  
  router.get('/:pid', (req, res) => {
    const products = productManager.getProducts();
    const product = products.find(p => p.id === req.params.pid);
    if (product) res.send(product);
    else res.status(404).send({ message: 'Product not found' });
  });

  
  router.post('/', (req, res) => {
    try {
      const newProduct = productManager.addProduct(req.body);
      
      if (io && typeof io.emit === 'function') io.emit('updateProducts', productManager.getProducts());
      res.status(201).send(newProduct);
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: 'Error creating product' });
    }
  });

  
  router.put('/:pid', (req, res) => {
    const updated = productManager.updateProduct(req.params.pid, req.body);
    if (updated) {
      if (io && typeof io.emit === 'function') io.emit('updateProducts', productManager.getProducts());
      res.send(updated);
    } else {
      res.status(404).send({ message: 'Product not found' });
    }
  });

  
  router.delete('/:pid', (req, res) => {
    const existed = productManager.deleteProduct(req.params.pid);
    if (existed) {
      if (io && typeof io.emit === 'function') io.emit('updateProducts', productManager.getProducts());
      res.send({ message: 'Product deleted' });
    } else {
      res.status(404).send({ message: 'Product not found' });
    }
  });

  return router;
};
