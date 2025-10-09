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

// product manager
const productManager = require('./utils/productManager');

// helper to detect routers
const isRouterLike = (obj) => {
  return typeof obj === 'function' || (obj && typeof obj.use === 'function');
};

// load products routes (factory that accepts io)
let productsModule = require('./routes/products');
let productsRouter;
if (typeof productsModule === 'function') {
  productsRouter = productsModule(io);
} else {
  productsRouter = productsModule;
}
if (!isRouterLike(productsRouter)) {
  console.error('ERROR: routes/products did not export an Express router or a function that returns one.');
  console.error('Value exported:', productsModule);
  throw new Error('routes/products must export an Express Router or a function (io) => Router');
}

// load views router
let viewsModule = require('./routes/views');
let viewsRouter = viewsModule;
if (!isRouterLike(viewsRouter) && typeof viewsModule === 'object' && viewsModule.router) {
  viewsRouter = viewsModule.router;
}
if (!isRouterLike(viewsRouter)) {
  console.error('ERROR: routes/views did not export an Express router.');
  console.error('Value exported:', viewsModule);
  throw new Error('routes/views must export an Express Router');
}

// mount routes
app.use('/api/products', productsRouter);
app.use('/', viewsRouter);

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado, id:', socket.id);

  // enviar lista inicial de productos
  socket.emit('updateProducts', productManager.getProducts());

  // crear producto via socket (desde la vista)
  socket.on('createProduct', (data) => {
    try {
      const newProduct = productManager.addProduct(data);
      const products = productManager.getProducts();
      // emitir nueva lista y notificación de éxito a todos los clientes
      io.emit('updateProducts', products);
      io.emit('actionSuccess', { message: 'Producto creado correctamente' });
      // también confirmar al socket origen (opcional, ya se emite a todos)
      socket.emit('createProductResult', { ok: true, product: newProduct });
    } catch (err) {
      console.error('Error createProduct socket:', err);
      const msg = err && err.message ? err.message : 'No se pudo crear el producto';
      socket.emit('actionError', { message: msg });
    }
  });

  // eliminar producto via socket (desde la vista)
  socket.on('deleteProduct', (pid) => {
    try {
      const existed = productManager.deleteProduct(pid);
      if (!existed) {
        socket.emit('actionError', { message: 'Producto no encontrado' });
        return;
      }
      const products = productManager.getProducts();
      io.emit('updateProducts', products);
      io.emit('actionSuccess', { message: 'Producto eliminado correctamente' });
    } catch (err) {
      console.error('Error deleteProduct socket:', err);
      socket.emit('actionError', { message: 'No se pudo eliminar el producto' });
    }
  });
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
