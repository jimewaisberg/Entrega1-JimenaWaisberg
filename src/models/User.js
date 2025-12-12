const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userCollection = 'users';

const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  age: {
    type: Number,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart'
  },
  role: {
    type: String,
    default: 'user'
  }
}, {
  timestamps: true
});

// Método estático para crear hash de contraseña
userSchema.statics.createHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

// Método de instancia para validar contraseña
userSchema.methods.isValidPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

const User = mongoose.model(userCollection, userSchema);

module.exports = User;

