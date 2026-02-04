/**
 * User Service
 * Capa de lógica de negocio para usuarios
 */
const userRepository = require('../repositories/user.repository');
const cartRepository = require('../repositories/cart.repository');
const UserDTO = require('../dto/user.dto');
const User = require('../models/User');
const bcrypt = require('bcrypt');

class UserService {
  async getUserById(id) {
    const user = await userRepository.getById(id);
    if (!user) return null;
    return new UserDTO(user);
  }

  async getUserByEmail(email) {
    return await userRepository.getByEmail(email);
  }

  async getAllUsers() {
    return await userRepository.getAll();
  }

  async createUser(userData) {
    // Verificar si el email ya existe
    const existingUser = await userRepository.getByEmail(userData.email);
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Crear carrito para el nuevo usuario
    const newCart = await cartRepository.create({ products: [] });

    // Hashear contraseña
    const hashedPassword = User.createHash(userData.password);

    // Crear usuario
    const newUser = await userRepository.create({
      ...userData,
      password: hashedPassword,
      cart: newCart._id,
      role: userData.role || 'user'
    });

    return new UserDTO(newUser);
  }

  async updateUser(id, userData) {
    const updatedUser = await userRepository.update(id, userData);
    if (!updatedUser) return null;
    return new UserDTO(updatedUser);
  }

  async deleteUser(id) {
    return await userRepository.delete(id);
  }

  async validatePassword(user, password) {
    return user.isValidPassword(password);
  }

  async updatePassword(userId, newPassword, oldPasswordHash = null) {
    // Si se proporciona el hash anterior, verificar que no sea la misma contraseña
    if (oldPasswordHash) {
      const isSamePassword = bcrypt.compareSync(newPassword, oldPasswordHash);
      if (isSamePassword) {
        throw new Error('La nueva contraseña no puede ser igual a la anterior');
      }
    }

    const hashedPassword = User.createHash(newPassword);
    return await userRepository.updatePassword(userId, hashedPassword);
  }

  // Obtener DTO de usuario (para /current)
  getUserDTO(user) {
    return new UserDTO(user);
  }
}

module.exports = new UserService();

