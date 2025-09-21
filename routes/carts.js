const express = require('express');
const router = express.Router();
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const dataPath = './data/carrito.json';

const getCarts = () => {
  const jsonData = fs.readFileSync(dataPath);
  return JSON.parse(jsonData);
};

const saveCarts = (data) => {
  const stringifyData = JSON.stringify(data, null, 2);
  fs.writeFileSync(dataPath, stringifyData);
};

router.post('/', (req, res) => {
  const carts = getCarts();
  const newCart = {
    id: uuidv4(),
    products: []
  };
  carts.push(newCart);
  saveCarts(carts);
  res.status(201).send(newCart);
});

router.get('/:cid', (req, res) => {
  const carts = getCarts();
  const cart = carts.find(c => c.id === req.params.cid);
  res.send(cart ? cart.products : []);
});

router.post('/:cid/product/:pid', (req, res) => {
  const carts = getCarts();
  const cartIndex = carts.findIndex(c => c.id === req.params.cid);
  if (cartIndex !== -1) {
    const cart = carts[cartIndex];
    const productIndex = cart.products.findIndex(p => p.product === req.params.pid);
    if (productIndex !== -1) {
      cart.products[productIndex].quantity += 1;
    } else {
      cart.products.push({ product: req.params.pid, quantity: 1 });
    }
    saveCarts(carts);
    res.send(cart);
  } else {
    res.status(404).send({ message: 'Cart not found' });
  }
});

module.exports = router;