const express = require('express');
const router = express.Router();
const productManager = require('../utils/productManager');

// GET /api/products - con paginación, filtros y ordenamiento
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const sort = req.query.sort || null; // 'asc' o 'desc'
    const query = req.query.query || null; // filtro

    // Validar parámetros
    if (limit < 1 || page < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'limit y page deben ser números positivos'
      });
    }

    const result = await productManager.getProductsPaginated({
      limit,
      page,
      sort,
      query
    });

    const { products, pagination } = result;

    // Construir links de paginación
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const buildLink = (pageNum) => {
      const params = new URLSearchParams();
      if (limit !== 10) params.append('limit', limit);
      if (pageNum !== 1) params.append('page', pageNum);
      if (sort) params.append('sort', sort);
      if (query) params.append('query', query);
      const queryString = params.toString();
      return queryString ? `${baseUrl}?${queryString}` : baseUrl;
    };

    const response = {
      status: 'success',
      payload: products,
      totalPages: pagination.totalPages,
      prevPage: pagination.prevPage,
      nextPage: pagination.nextPage,
      page: pagination.page,
      hasPrevPage: pagination.hasPrevPage,
      hasNextPage: pagination.hasNextPage,
      prevLink: pagination.hasPrevPage ? buildLink(pagination.prevPage) : null,
      nextLink: pagination.hasNextPage ? buildLink(pagination.nextPage) : null
    };

    res.json(response);
  } catch (error) {
    console.error('GET /api/products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener productos',
      error: error.message
    });
  }
});

// GET /api/products/:pid
router.get('/:pid', async (req, res) => {
  try {
    const product = await productManager.getProductById(req.params.pid);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('GET /api/products/:pid error:', error);
    res.status(500).json({ message: 'Error al obtener producto' });
  }
});

// POST /api/products - método del router que hace el alta y emite eventos usando req.io
const postProduct = async (req, res) => {
  try {
    const newProduct = await productManager.addProduct(req.body);
    // emitir usando req.io del middleware
    if (req.io && typeof req.io.emit === 'function') {
      const products = await productManager.getProducts();
      req.io.emit('updateProducts', products);
      req.io.emit('actionSuccess', { message: 'Producto creado correctamente' });
    }
    if (res) {
      res.status(201).json(newProduct);
    }
    return newProduct;
  } catch (err) {
    console.error('POST /api/products error:', err);
    if (err && err.isValidation) {
      if (req.io && typeof req.io.emit === 'function') {
        req.io.emit('actionError', { message: err.message });
      }
      if (res) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
    if (res) {
      res.status(500).json({ message: 'Error creating product' });
    }
    throw err;
  }
};

router.post('/', postProduct);

// PUT /api/products/:pid
router.put('/:pid', async (req, res) => {
  try {
    const updated = await productManager.updateProduct(req.params.pid, req.body);
    if (updated) {
      if (req.io && typeof req.io.emit === 'function') {
        const products = await productManager.getProducts();
        req.io.emit('updateProducts', products);
        req.io.emit('actionSuccess', { message: 'Producto actualizado correctamente' });
      }
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    console.error('PUT /api/products/:pid error:', err);
    if (err && err.isValidation) {
      if (req.io && typeof req.io.emit === 'function') {
        req.io.emit('actionError', { message: err.message });
      }
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error updating product' });
  }
});

// DELETE /api/products/:pid - método del router que hace la baja y emite eventos usando req.io
const deleteProduct = async (req, res) => {
  try {
    const existed = await productManager.deleteProduct(req.params.pid);
    if (existed) {
      // emitir usando req.io del middleware
      if (req.io && typeof req.io.emit === 'function') {
        const products = await productManager.getProducts();
        req.io.emit('updateProducts', products);
        req.io.emit('actionSuccess', { message: 'Producto eliminado correctamente' });
      }
      if (res) {
        res.json({ message: 'Product deleted' });
      }
      return true;
    } else {
      if (res) {
        res.status(404).json({ message: 'Product not found' });
      }
      return false;
    }
  } catch (err) {
    console.error('DELETE /api/products/:pid error:', err);
    if (res) {
      res.status(500).json({ message: 'Error deleting product' });
    }
    throw err;
  }
};

router.delete('/:pid', deleteProduct);

module.exports = router;
// Exportar los métodos para que puedan ser usados desde sockets
module.exports.postProduct = postProduct;
module.exports.deleteProduct = deleteProduct;
