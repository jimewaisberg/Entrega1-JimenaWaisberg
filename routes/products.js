const express = require('express');
const router = express.Router();
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const dataPath = './data/productos.json';

const getProducts = () => {
  const jsonData = fs.readFileSync(dataPath);
  return JSON.parse(jsonData);
};

const saveProducts = (data) => {
  const stringifyData = JSON.stringify(data, null, 2);
  fs.writeFileSync(dataPath, stringifyData);
};

router.get('/', (req, res) => {
  const products = getProducts();
  let limit = req.query.limit ? parseInt(req.query.limit) : products.length;
  res.send(products.slice(0, limit));
});

router.get('/:pid', (req, res) => {
  const products = getProducts();
  const product = products.find(p => p.id === req.params.pid);
  res.send(product);
});

router.post('/', (req, res) => {
  const products = getProducts();
  const newProduct = {
    id: uuidv4(),
    title: req.body.title,
    description: req.body.description,
    code: req.body.code,
    price: req.body.price,
    status: req.body.status || true,
    stock: req.body.stock,
    category: req.body.category,
    thumbnails: req.body.thumbnails || []
  };
  products.push(newProduct);
  saveProducts(products);
  res.status(201).send(newProduct);
});

router.put('/:pid', (req, res) => {
  const products = getProducts();
  const productIndex = products.findIndex(p => p.id === req.params.pid);
  if (productIndex !== -1) {
    const updatedProduct = { ...products[productIndex], ...req.body, id: products[productIndex].id };
    products[productIndex] = updatedProduct;
    saveProducts(products);
    res.send(updatedProduct);
  } else {
    res.status(404).send({ message: 'Product not found' });
  }
});

router.delete('/:pid', (req, res) => {
  let products = getProducts();
  products = products.filter(p => p.id !== req.params.pid);
  saveProducts(products);
  res.send({ message: 'Product deleted' });
});

module.exports = router;