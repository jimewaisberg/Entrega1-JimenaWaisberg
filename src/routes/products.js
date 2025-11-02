const express = require('express');
const router = express.Router();
const productManager = require('../utils/productManager');

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

// POST /api/products - método del router que hace el alta y emite eventos usando req.io
const postProduct = (req, res) => {
  try {
    const newProduct = productManager.addProduct(req.body);
    // emitir usando req.io del middleware
    if (req.io && typeof req.io.emit === 'function') {
      req.io.emit('updateProducts', productManager.getProducts());
      req.io.emit('actionSuccess', { message: 'Producto creado correctamente' });
    }
    if (res) {
      res.status(201).send(newProduct);
    }
  } catch (err) {
    console.error('POST /api/products error:', err);
    if (err && err.isValidation) {
      if (req.io && typeof req.io.emit === 'function') {
        req.io.emit('actionError', { message: err.message });
      }
      if (res) {
        return res.status(400).send({ message: err.message });
      }
      throw err;
    }
    if (res) {
      res.status(500).send({ message: 'Error creating product' });
    }
    throw err;
  }
};

router.post('/', postProduct);

// PUT /api/products/:pid
router.put('/:pid', (req, res) => {
  try {
    const updated = productManager.updateProduct(req.params.pid, req.body);
    if (updated) {
      if (req.io && typeof req.io.emit === 'function') {
        req.io.emit('updateProducts', productManager.getProducts());
        req.io.emit('actionSuccess', { message: 'Producto actualizado correctamente' });
      }
      res.send(updated);
    } else {
      res.status(404).send({ message: 'Product not found' });
    }
  } catch (err) {
    console.error('PUT /api/products/:pid error:', err);
    if (err && err.isValidation) {
      if (req.io && typeof req.io.emit === 'function') {
        req.io.emit('actionError', { message: err.message });
      }
      return res.status(400).send({ message: err.message });
    }
    res.status(500).send({ message: 'Error updating product' });
  }
});

// DELETE /api/products/:pid - método del router que hace la baja y emite eventos usando req.io
const deleteProduct = (req, res) => {
  try {
    const existed = productManager.deleteProduct(req.params.pid);
    if (existed) {
      // emitir usando req.io del middleware
      if (req.io && typeof req.io.emit === 'function') {
        req.io.emit('updateProducts', productManager.getProducts());
        req.io.emit('actionSuccess', { message: 'Producto eliminado correctamente' });
      }
      if (res) {
        res.send({ message: 'Product deleted' });
      }
      return true;
    } else {
      if (res) {
        res.status(404).send({ message: 'Product not found' });
      }
      return false;
    }
  } catch (err) {
    console.error('DELETE /api/products/:pid error:', err);
    if (res) {
      res.status(500).send({ message: 'Error deleting product' });
    }
    throw err;
  }
};

router.delete('/:pid', deleteProduct);

module.exports = router;
// Exportar los métodos para que puedan ser usados desde sockets
module.exports.postProduct = postProduct;
module.exports.deleteProduct = deleteProduct;

