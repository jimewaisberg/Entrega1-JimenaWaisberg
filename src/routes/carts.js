/**
 * Carts Router
 * Maneja operaciones de carritos de compra
 * Middleware de autorización: Solo usuarios pueden agregar productos a su carrito
 * Usa la estrategia "current" de Passport para autenticación
 */
const express = require('express');
const router = express.Router();
const cartService = require('../services/cart.service');
const emailService = require('../services/email.service');
const { authenticateCurrent, isUser, isCartOwner } = require('../middlewares/authorization');

/**
 * POST /api/carts
 * Crear nuevo carrito
 */
router.post('/', async (req, res) => {
  try {
    const newCart = await cartService.createCart();
    res.status(201).json(newCart);
  } catch (error) {
    console.error('POST /api/carts error:', error);
    res.status(500).json({ message: 'Error al crear carrito' });
  }
});

/**
 * GET /api/carts/:cid
 * Obtener carrito con productos poblados
 */
router.get('/:cid', async (req, res) => {
  try {
    const cart = await cartService.getCartByIdPopulated(req.params.cid);
    if (!cart) {
      return res.status(404).json({ message: 'Carrito no encontrado' });
    }
    res.json(cart);
  } catch (error) {
    console.error('GET /api/carts/:cid error:', error);
    res.status(500).json({ message: 'Error al obtener carrito' });
  }
});

/**
 * POST /api/carts/:cid/product/:pid
 * Agregar producto al carrito
 * Solo USER puede ejecutar esta acción (y solo en su propio carrito)
 * Usa estrategia "current" para autenticación
 */
router.post('/:cid/product/:pid', authenticateCurrent, isUser, isCartOwner, async (req, res) => {
  try {
    const cart = await cartService.addProductToCart(req.params.cid, req.params.pid);
    if (!cart) {
      return res.status(404).json({ message: 'Carrito no encontrado' });
    }
    const populatedCart = await cartService.getCartByIdPopulated(req.params.cid);
    res.json(populatedCart);
  } catch (error) {
    console.error('POST /api/carts/:cid/product/:pid error:', error);
    res.status(500).json({ message: error.message || 'Error al agregar producto al carrito' });
  }
});

/**
 * DELETE /api/carts/:cid/products/:pid
 * Eliminar producto del carrito
 * Usa estrategia "current" para autenticación
 */
router.delete('/:cid/products/:pid', authenticateCurrent, isCartOwner, async (req, res) => {
  try {
    const cart = await cartService.removeProductFromCart(req.params.cid, req.params.pid);
    if (!cart) {
      return res.status(404).json({ message: 'Carrito no encontrado' });
    }
    const populatedCart = await cartService.getCartByIdPopulated(req.params.cid);
    res.json(populatedCart);
  } catch (error) {
    console.error('DELETE /api/carts/:cid/products/:pid error:', error);
    res.status(500).json({ message: 'Error al eliminar producto del carrito' });
  }
});

/**
 * PUT /api/carts/:cid
 * Actualizar todos los productos del carrito
 * Usa estrategia "current" para autenticación
 */
router.put('/:cid', authenticateCurrent, isCartOwner, async (req, res) => {
  try {
    if (!Array.isArray(req.body.products)) {
      return res.status(400).json({ message: 'products debe ser un array' });
    }

    const isValidProduct = (p) => {
      return p && p.product && typeof p.quantity === 'number' && p.quantity > 0;
    };

    if (!req.body.products.every(isValidProduct)) {
      return res.status(400).json({ 
        message: 'Cada producto debe tener "product" (id) y "quantity" (número positivo)' 
      });
    }

    await cartService.updateCart(req.params.cid, req.body.products);
    const populatedCart = await cartService.getCartByIdPopulated(req.params.cid);
    res.json(populatedCart);
  } catch (error) {
    console.error('PUT /api/carts/:cid error:', error);
    res.status(500).json({ message: error.message || 'Error al actualizar carrito' });
  }
});

/**
 * PUT /api/carts/:cid/products/:pid
 * Actualizar SOLO la cantidad de un producto
 * Usa estrategia "current" para autenticación
 */
router.put('/:cid/products/:pid', authenticateCurrent, isCartOwner, async (req, res) => {
  try {
    const quantity = req.body.quantity;
    if (quantity === undefined || typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({ 
        message: 'quantity debe ser un número positivo mayor a 0' 
      });
    }

    const cart = await cartService.updateProductQuantity(req.params.cid, req.params.pid, quantity);
    if (!cart) {
      return res.status(404).json({ message: 'Carrito o producto no encontrado' });
    }
    const populatedCart = await cartService.getCartByIdPopulated(req.params.cid);
    res.json(populatedCart);
  } catch (error) {
    console.error('PUT /api/carts/:cid/products/:pid error:', error);
    res.status(500).json({ message: error.message || 'Error al actualizar cantidad del producto' });
  }
});

/**
 * DELETE /api/carts/:cid
 * Eliminar todos los productos del carrito
 * Usa estrategia "current" para autenticación
 */
router.delete('/:cid', authenticateCurrent, isCartOwner, async (req, res) => {
  try {
    const cart = await cartService.clearCart(req.params.cid);
    if (!cart) {
      return res.status(404).json({ message: 'Carrito no encontrado' });
    }
    const populatedCart = await cartService.getCartByIdPopulated(req.params.cid);
    res.json(populatedCart);
  } catch (error) {
    console.error('DELETE /api/carts/:cid error:', error);
    res.status(500).json({ message: 'Error al vaciar carrito' });
  }
});

/**
 * POST /api/carts/:cid/purchase
 * Finalizar compra del carrito
 * - Verifica stock de cada producto
 * - Genera ticket con productos comprados
 * - Mantiene en carrito los productos sin stock
 * - Envía email de confirmación
 * Usa estrategia "current" para autenticación
 */
router.post('/:cid/purchase', authenticateCurrent, isCartOwner, async (req, res) => {
  try {
    const purchaserEmail = req.user.email;
    
    const result = await cartService.purchaseCart(req.params.cid, purchaserEmail);
    
    if (!result.success && !result.ticket) {
      return res.status(400).json({
        status: 'error',
        message: result.message,
        productsNotPurchased: result.productsNotPurchased
      });
    }

    // Enviar email de confirmación (no bloqueante)
    if (result.ticket) {
      emailService.sendPurchaseConfirmationEmail(purchaserEmail, result.ticket)
        .catch(err => console.error('Error enviando email de confirmación:', err));
    }

    res.json({
      status: 'success',
      message: result.message,
      ticket: result.ticket,
      productsNotPurchased: result.productsNotPurchased
    });
  } catch (error) {
    console.error('POST /api/carts/:cid/purchase error:', error);
    res.status(500).json({ 
      status: 'error',
      message: error.message || 'Error al procesar la compra' 
    });
  }
});

module.exports = router;
