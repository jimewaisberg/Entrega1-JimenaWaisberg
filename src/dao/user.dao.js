/**
 * User DAO - Data Access Object
 * Capa de acceso a datos para usuarios
 * Solo contiene operaciones de base de datos
 */
const User = require('../models/User');

class UserDAO {
  async findById(id) {
    return await User.findById(id);
  }

  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async findAll() {
    return await User.find();
  }

  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async update(id, userData) {
    return await User.findByIdAndUpdate(id, userData, { new: true });
  }

  async delete(id) {
    return await User.findByIdAndDelete(id);
  }

  async updatePassword(id, hashedPassword) {
    return await User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true });
  }
}

module.exports = new UserDAO();

