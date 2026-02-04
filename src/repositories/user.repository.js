/**
 * User Repository
 * Capa intermedia entre Services y DAOs
 * Implementa el patrón Repository
 */
const userDAO = require('../dao/user.dao');
const UserDTO = require('../dto/user.dto');

class UserRepository {
  async getById(id) {
    const user = await userDAO.findById(id);
    return user;
  }

  async getByEmail(email) {
    return await userDAO.findByEmail(email);
  }

  async getAll() {
    const users = await userDAO.findAll();
    return users.map(user => new UserDTO(user));
  }

  async create(userData) {
    return await userDAO.create(userData);
  }

  async update(id, userData) {
    return await userDAO.update(id, userData);
  }

  async delete(id) {
    return await userDAO.delete(id);
  }

  async updatePassword(id, hashedPassword) {
    return await userDAO.updatePassword(id, hashedPassword);
  }

  // Devuelve DTO para no exponer datos sensibles
  getDTO(user) {
    return new UserDTO(user);
  }
}

module.exports = new UserRepository();

