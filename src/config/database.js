const mongoose = require('mongoose');
let memoryServerInstance = null;

const connectDB = async () => {
  try {
    // Opción: usar base en memoria para desarrollo/pruebas
    if (process.env.USE_IN_MEMORY_DB === 'true') {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const uri = memoryServerInstance.getUri();
      await mongoose.connect(uri);
      console.log('MongoDB en memoria iniciado correctamente');
      return;
    }

    // MongoDB real (Atlas/local)
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB conectado correctamente');
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error);
    // En producción, no debería hacer crash del servidor
    process.exit(1);
  }
};

module.exports = connectDB;

