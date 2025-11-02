const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const exphbs = require('express-handlebars');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Handlebars
app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// static
app.use(express.static(path.join(__dirname, 'public')));

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para pasar io a los routers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// routes
const productsRouter = require('./routes/products');
const { postProduct, deleteProduct } = require('./routes/products');
const viewsRouter = require('./routes/views');
const cartsRouter = require('./routes/carts');

// mount routes
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/', viewsRouter);

// Socket.IO logic - los sockets usan los métodos del router directamente
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado, id:', socket.id);
  const productManager = require('./utils/productManager');
  socket.emit('updateProducts', productManager.getProducts());

  // crear producto via socket - usar método POST del router
  socket.on('createProduct', (data) => {
    const req = { body: data, io: io };
    try {
      postProduct(req, null);
      socket.emit('createProductResult', { ok: true });
    } catch (err) {
      const msg = err && err.message ? err.message : 'No se pudo crear el producto';
      socket.emit('actionError', { message: msg });
    }
  });

  // eliminar producto via socket - usar método DELETE del router
  socket.on('deleteProduct', (pid) => {
    const req = { params: { pid: pid }, io: io };
    try {
      const result = deleteProduct(req, null);
      if (!result) {
        socket.emit('actionError', { message: 'Producto no encontrado' });
      }
    } catch (err) {
      socket.emit('actionError', { message: 'No se pudo eliminar el producto' });
    }
  });
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

