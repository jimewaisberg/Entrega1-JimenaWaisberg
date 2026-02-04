/**
 * E-commerce Application
 * Arquitectura profesional con patrones de diseño
 */

// Cargar variables de entorno primero
require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const connectDB = require('./config/database');
const initializePassport = require('./config/passport.config');

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

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Passport initialization
initializePassport();
app.use(passport.initialize());

// Middleware para pasar io a los routers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
const productsRouter = require('./routes/products');
const viewsRouter = require('./routes/views');
const cartsRouter = require('./routes/carts');
const sessionsRouter = require('./routes/sessions');

// Mount routes
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/', viewsRouter);

// Middleware 404
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Ruta no encontrada'
  });
});

// Socket.IO logic
io.on('connection', async (socket) => {
  console.log('Nuevo cliente conectado, id:', socket.id);
  const productService = require('./services/product.service');
  
  try {
    const products = await productService.getAllProducts();
    socket.emit('updateProducts', products);
  } catch (error) {
    console.error('Error sending initial products:', error);
  }

  // Crear producto via socket (requeriría autenticación en producción)
  socket.on('createProduct', async (data) => {
    try {
      const newProduct = await productService.createProduct(data);
      const products = await productService.getAllProducts();
      io.emit('updateProducts', products);
      socket.emit('createProductResult', { ok: true });
    } catch (err) {
      const msg = err && err.message ? err.message : 'No se pudo crear el producto';
      socket.emit('actionError', { message: msg });
    }
  });

  // Eliminar producto via socket (requeriría autenticación en producción)
  socket.on('deleteProduct', async (pid) => {
    try {
      const deleted = await productService.deleteProduct(pid);
      if (deleted) {
        const products = await productService.getAllProducts();
        io.emit('updateProducts', products);
      } else {
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
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error en middleware:', err);
  
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
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
