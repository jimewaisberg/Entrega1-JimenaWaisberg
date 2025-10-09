const express = require('express');
const router = express.Router();
const productManager = require('../utils/productManager');

module.exports = (io) => {

  // GET /api/products?limit=#
  router.get('/', (req, res) => {
    const products = productManager.getProducts();
    let limit = req.query.limit ? parseInt(req.query.limit) : products.length;
    res.send(products.slice(0, limit));
  });

  // GET /api/products/:pid
  router.get('/:pid', (req, res) => {
    const products = productManager.getProducts();
    const product = products.find(p => p.id === req.params.pid);
    if (product) res.send(product);
    else res.status(404).send({ message: 'Product not found' });
  });

  // POST /api/products
  router.post('/', (req, res) => {
    try {
      const newProduct = productManager.addProduct(req.body);
      // emitir update y notificación de éxito
      if (io && typeof io.emit === 'function') {
        io.emit('updateProducts', productManager.getProducts());
        io.emit('actionSuccess', { message: 'Producto creado correctamente (HTTP)' });
      }
      res.status(201).send(newProduct);
    } catch (err) {
      console.error('POST /api/products error:', err);
      if (err && err.isValidation) {
        // emitir error a clientes (opcional)
        if (io && typeof io.emit === 'function') io.emit('actionError', { message: err.message });
        return res.status(400).send({ message: err.message });
      }
      res.status(500).send({ message: 'Error creating product' });
    }
  });

  // PUT /api/products/:pid
  router.put('/:pid', (req, res) => {
    try {
      const updated = productManager.updateProduct(req.params.pid, req.body);
      if (updated) {
        if (io && typeof io.emit === 'function') {
          io.emit('updateProducts', productManager.getProducts());
          io.emit('actionSuccess', { message: 'Producto actualizado correctamente (HTTP)' });
        }
        res.send(updated);
      } else {
        res.status(404).send({ message: 'Product not found' });
      }
    } catch (err) {
      console.error('PUT /api/products/:pid error:', err);
      if (err && err.isValidation) {
        if (io && typeof io.emit === 'function') io.emit('actionError', { message: err.message });
        return res.status(400).send({ message: err.message });
      }
      res.status(500).send({ message: 'Error updating product' });
    }
  });

  // DELETE /api/products/:pid
  router.delete('/:pid', (req, res) => {
    try {
      const existed = productManager.deleteProduct(req.params.pid);
      if (existed) {
        if (io && typeof io.emit === 'function') {
          io.emit('updateProducts', productManager.getProducts());
          io.emit('actionSuccess', { message: 'Producto eliminado correctamente (HTTP)' });
        }
        res.send({ message: 'Product deleted' });
      } else {
        res.status(404).send({ message: 'Product not found' });
      }
    } catch (err) {
      console.error('DELETE /api/products/:pid error:', err);
      res.status(500).send({ message: 'Error deleting product' });
    }
  });

  return router;
};
