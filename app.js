
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const exphbs = require('express-handlebars');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);


app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));


app.use(express.static(path.join(__dirname, 'public')));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const productManager = require('./utils/productManager');


const isRouterLike = (obj) => {
  
  return typeof obj === 'function' || (obj && typeof obj.use === 'function');
};


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


app.use('/api/products', productsRouter);
app.use('/', viewsRouter);


io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado, id:', socket.id);

  
  socket.emit('updateProducts', productManager.getProducts());

  
  socket.on('createProduct', (data) => {
    try {
      productManager.addProduct(data);
      const products = productManager.getProducts();
      io.emit('updateProducts', products);
    } catch (err) {
      console.error('Error createProduct socket:', err);
      socket.emit('error', { message: 'No se pudo crear el producto' });
    }
  });

  
  socket.on('deleteProduct', (pid) => {
    try {
      productManager.deleteProduct(pid);
      const products = productManager.getProducts();
      io.emit('updateProducts', products);
    } catch (err) {
      console.error('Error deleteProduct socket:', err);
      socket.emit('error', { message: 'No se pudo eliminar el producto' });
    }
  });
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
