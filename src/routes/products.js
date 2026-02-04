/**
 * Products Router
 * Maneja operaciones CRUD de productos
 * Middleware de autorización: Solo admin puede crear, actualizar y eliminar
 * Usa la estrategia "current" de Passport para autenticación
 */
const express = require('express');
const router = express.Router();
const productService = require('../services/product.service');
const { authenticateCurrent, isAdmin } = require('../middlewares/authorization');

/**
 * GET /api/products
 * Obtener productos con paginación, filtros y ordenamiento
 * Público - no requiere autenticación
 */
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const sort = req.query.sort || null;
    const query = req.query.query || null;

    if (limit < 1 || page < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'limit y page deben ser números positivos'
      });
    }

    const result = await productService.getProductsPaginated({
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

    res.json({
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
    });
  } catch (error) {
    console.error('GET /api/products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener productos',
      error: error.message
    });
  }
});

/**
 * GET /api/products/:pid
 * Obtener un producto por ID
 * Público - no requiere autenticación
 */
router.get('/:pid', async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.pid);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (error) {
    console.error('GET /api/products/:pid error:', error);
    res.status(500).json({ message: 'Error al obtener producto' });
  }
});

/**
 * POST /api/products
 * Crear un nuevo producto
 * Solo ADMIN puede ejecutar esta acción
 * Usa estrategia "current" para autenticación
 */
const postProduct = async (req, res) => {
  try {
    const newProduct = await productService.createProduct(req.body);
    
    // Emitir evento de actualización si hay socket.io
    if (req.io && typeof req.io.emit === 'function') {
      const products = await productService.getAllProducts();
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
      res.status(500).json({ message: 'Error al crear producto' });
    }
    throw err;
  }
};

// Ruta protegida: Solo admin (usa estrategia "current")
router.post('/', authenticateCurrent, isAdmin, postProduct);

/**
 * PUT /api/products/:pid
 * Actualizar un producto
 * Solo ADMIN puede ejecutar esta acción
 * Usa estrategia "current" para autenticación
 */
router.put('/:pid', authenticateCurrent, isAdmin, async (req, res) => {
  try {
    const updated = await productService.updateProduct(req.params.pid, req.body);
    if (updated) {
      if (req.io && typeof req.io.emit === 'function') {
        const products = await productService.getAllProducts();
        req.io.emit('updateProducts', products);
        req.io.emit('actionSuccess', { message: 'Producto actualizado correctamente' });
      }
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (err) {
    console.error('PUT /api/products/:pid error:', err);
    if (err && err.isValidation) {
      if (req.io && typeof req.io.emit === 'function') {
        req.io.emit('actionError', { message: err.message });
      }
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
});

/**
 * DELETE /api/products/:pid
 * Eliminar un producto
 * Solo ADMIN puede ejecutar esta acción
 * Usa estrategia "current" para autenticación
 */
const deleteProduct = async (req, res) => {
  try {
    const deleted = await productService.deleteProduct(req.params.pid);
    if (deleted) {
      if (req.io && typeof req.io.emit === 'function') {
        const products = await productService.getAllProducts();
        req.io.emit('updateProducts', products);
        req.io.emit('actionSuccess', { message: 'Producto eliminado correctamente' });
      }
      if (res) {
        res.json({ message: 'Producto eliminado' });
      }
      return true;
    } else {
      if (res) {
        res.status(404).json({ message: 'Producto no encontrado' });
      }
      return false;
    }
  } catch (err) {
    console.error('DELETE /api/products/:pid error:', err);
    if (res) {
      res.status(500).json({ message: 'Error al eliminar producto' });
    }
    throw err;
  }
};

router.delete('/:pid', authenticateCurrent, isAdmin, deleteProduct);

module.exports = router;
module.exports.postProduct = postProduct;
module.exports.deleteProduct = deleteProduct;
