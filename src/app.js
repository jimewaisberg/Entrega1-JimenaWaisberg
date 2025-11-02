const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const exphbs = require('express-handlebars');
const connectDB = require('./config/database');

// Conectar a MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Handlebars con helpers personalizados
const hbs = exphbs.create({
  defaultLayout: 'main',
  helpers: {
    eq: function(a, b) { return a === b; },
    multiply: function(a, b) { 
      const result = parseFloat(a) * parseFloat(b);
      return isNaN(result) ? '0.00' : result.toFixed(2); 
    },
    calculateTotal: function(products) {
      if (!products || !Array.isArray(products)) return '0.00';
      const total = products.reduce((sum, item) => {
        if (item.product && item.product.price && item.quantity) {
          return sum + (parseFloat(item.product.price) * parseInt(item.quantity));
        }
        return sum;
      }, 0);
      return total.toFixed(2);
    }
  }
});

app.engine('handlebars', hbs.engine);
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

// Middleware 404 - debe ir después de las rutas
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Ruta no encontrada'
  });
});

// Socket.IO logic - los sockets usan los métodos del router directamente
io.on('connection', async (socket) => {
  console.log('Nuevo cliente conectado, id:', socket.id);
  const productManager = require('./utils/productManager');
  
  try {
    const products = await productManager.getProducts();
    socket.emit('updateProducts', products);
  } catch (error) {
    console.error('Error sending initial products:', error);
  }

  // crear producto via socket - usar método POST del router
  socket.on('createProduct', async (data) => {
    const req = { body: data, io: io };
    try {
      await postProduct(req, null);
      socket.emit('createProductResult', { ok: true });
    } catch (err) {
      const msg = err && err.message ? err.message : 'No se pudo crear el producto';
      socket.emit('actionError', { message: msg });
    }
  });

  // eliminar producto via socket - usar método DELETE del router
  socket.on('deleteProduct', async (pid) => {
    const req = { params: { pid: pid }, io: io };
    try {
      const result = await deleteProduct(req, null);
      if (!result) {
        socket.emit('actionError', { message: 'Producto no encontrado' });
      }
    } catch (err) {
      socket.emit('actionError', { message: 'No se pudo eliminar el producto' });
    }
  });
});

// Manejo global de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Error fatal no capturado:', error);
  // No hacer exit en desarrollo, pero registrar el error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
  // No hacer exit en desarrollo, pero registrar el error
});

// Middleware de manejo de errores global - debe ir después de todas las rutas
app.use((err, req, res, next) => {
  console.error('Error en middleware:', err);
  
  // No reiniciar el servidor, solo responder con error
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Error interno del servidor'
  });
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

