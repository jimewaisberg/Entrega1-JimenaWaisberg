const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');

// POST /api/carts - crear nuevo carrito
router.post('/', async (req, res) => {
  try {
    const newCart = new Cart({ products: [] });
    await newCart.save();
    res.status(201).json(newCart);
  } catch (error) {
    console.error('POST /api/carts error:', error);
    res.status(500).json({ message: 'Error al crear carrito' });
  }
});

// GET /api/carts/:cid - obtener carrito con populate de productos
router.get('/:cid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid).populate('products.product');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.json(cart);
  } catch (error) {
    console.error('GET /api/carts/:cid error:', error);
    res.status(500).json({ message: 'Error al obtener carrito' });
  }
});

// POST /api/carts/:cid/product/:pid - agregar producto al carrito
router.post('/:cid/product/:pid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const productIndex = cart.products.findIndex(
      p => p.product.toString() === req.params.pid
    );

    if (productIndex !== -1) {
      // Si el producto ya existe, incrementar cantidad
      cart.products[productIndex].quantity += 1;
    } else {
      // Si no existe, agregarlo
      cart.products.push({
        product: req.params.pid,
        quantity: 1
      });
    }

    await cart.save();
    const populatedCart = await Cart.findById(req.params.cid).populate('products.product');
    res.json(populatedCart);
  } catch (error) {
    console.error('POST /api/carts/:cid/product/:pid error:', error);
    res.status(500).json({ message: 'Error al agregar producto al carrito' });
  }
});

// DELETE /api/carts/:cid/products/:pid - eliminar producto del carrito
router.delete('/:cid/products/:pid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.products = cart.products.filter(
      p => p.product.toString() !== req.params.pid
    );

    await cart.save();
    const populatedCart = await Cart.findById(req.params.cid).populate('products.product');
    res.json(populatedCart);
  } catch (error) {
    console.error('DELETE /api/carts/:cid/products/:pid error:', error);
    res.status(500).json({ message: 'Error al eliminar producto del carrito' });
  }
});

// PUT /api/carts/:cid - actualizar todos los productos del carrito
router.put('/:cid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Validar que req.body.products sea un array
    if (!Array.isArray(req.body.products)) {
      return res.status(400).json({ message: 'products debe ser un array' });
    }

    // Validar estructura de cada producto
    const isValidProduct = (p) => {
      return p && p.product && typeof p.quantity === 'number' && p.quantity > 0;
    };

    if (!req.body.products.every(isValidProduct)) {
      return res.status(400).json({ 
        message: 'Cada producto debe tener "product" (id) y "quantity" (número positivo)' 
      });
    }

    cart.products = req.body.products;
    await cart.save();
    const populatedCart = await Cart.findById(req.params.cid).populate('products.product');
    res.json(populatedCart);
  } catch (error) {
    console.error('PUT /api/carts/:cid error:', error);
    res.status(500).json({ message: 'Error al actualizar carrito' });
  }
});

// PUT /api/carts/:cid/products/:pid - actualizar SOLO la cantidad de un producto
router.put('/:cid/products/:pid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const productIndex = cart.products.findIndex(
      p => p.product.toString() === req.params.pid
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in cart' });
    }

    // Validar cantidad
    const quantity = req.body.quantity;
    if (quantity === undefined || typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({ 
        message: 'quantity debe ser un número positivo mayor a 0' 
      });
    }

    cart.products[productIndex].quantity = quantity;
    await cart.save();
    const populatedCart = await Cart.findById(req.params.cid).populate('products.product');
    res.json(populatedCart);
  } catch (error) {
    console.error('PUT /api/carts/:cid/products/:pid error:', error);
    res.status(500).json({ message: 'Error al actualizar cantidad del producto' });
  }
});

// DELETE /api/carts/:cid - eliminar todos los productos del carrito
router.delete('/:cid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.products = [];
    await cart.save();
    const populatedCart = await Cart.findById(req.params.cid).populate('products.product');
    res.json(populatedCart);
  } catch (error) {
    console.error('DELETE /api/carts/:cid error:', error);
    res.status(500).json({ message: 'Error al vaciar carrito' });
  }
});

module.exports = router;
