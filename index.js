// index.js
const express = require('express');
const app = express();
const productsRouter = require('./routes/products.router');
const cartsRouter = require('./routes/carts.router');

const PORT = 8080;

app.use(express.json());

// Rutas montadas según consigna
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

app.get('/', (req, res) => {
  res.send('API corriendo. Endpoints: /api/products y /api/carts');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
