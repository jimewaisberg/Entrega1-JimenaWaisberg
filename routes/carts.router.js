// routes/carts.router.js
const express = require('express');
const router = express.Router();
const CartManager = require('../managers/CartManager');
const ProductManager = require('../managers/ProductManager');

const cm = new CartManager('data/carts.json');
const pm = new ProductManager('data/products.json');

// GET /api/carts/ -> listar TODOS los carritos (útil para debug/administración)
router.get('/', async (req, res) => {
  try {
    const all = await cm.readFile(); // readFile expuesto en CartManager
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: 'Error leyendo carritos', details: err.message });
  }
});

// POST /api/carts/ -> crear carrito nuevo
router.post('/', async (req, res) => {
  try {
    const created = await cm.createCart();
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Error creando carrito', details: err.message });
  }
});

// GET /api/carts/:cid -> listar los productos del carrito (SEGUN CONSIGNA: SOLO products)
router.get('/:cid', async (req, res) => {
  try {
    const cart = await cm.getCartById(req.params.cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
    res.json(cart.products);
  } catch (err) {
    res.status(500).json({ error: 'Error leyendo carrito', details: err.message });
  }
});

// POST /api/carts/:cid/product/:pid -> agregar producto (1 unidad; si existe incrementa)
router.post('/:cid/product/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;

    // validar que el producto exista en products.json
    const product = await pm.getById(pid);
    if (!product) return res.status(404).json({ error: 'Producto no existe, no puede agregarse al carrito' });

    // validar que el carrito exista
    const cartExists = await cm.getCartById(cid);
    if (!cartExists) return res.status(404).json({ error: 'Carrito no encontrado' });

    const updatedCart = await cm.addProductToCart(cid, pid, 1);
    res.json(updatedCart);
  } catch (err) {
    res.status(500).json({ error: 'Error agregando producto al carrito', details: err.message });
  }
});

module.exports = router;
