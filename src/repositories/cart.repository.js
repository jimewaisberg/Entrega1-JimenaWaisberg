/**
 * Cart Repository
 * Capa intermedia entre Services y DAOs
 */
const cartDAO = require('../dao/cart.dao');

class CartRepository {
  async getById(id) {
    return await cartDAO.findById(id);
  }

  async getByIdPopulated(id) {
    return await cartDAO.findByIdPopulated(id);
  }

  async getAll() {
    return await cartDAO.findAll();
  }

  async create(cartData) {
    return await cartDAO.create(cartData);
  }

  async update(id, cartData) {
    return await cartDAO.update(id, cartData);
  }

  async delete(id) {
    return await cartDAO.delete(id);
  }

  async addProduct(cartId, productId, quantity = 1) {
    return await cartDAO.addProduct(cartId, productId, quantity);
  }

  async removeProduct(cartId, productId) {
    return await cartDAO.removeProduct(cartId, productId);
  }

  async updateProductQuantity(cartId, productId, quantity) {
    return await cartDAO.updateProductQuantity(cartId, productId, quantity);
  }

  async clearCart(cartId) {
    return await cartDAO.clearCart(cartId);
  }
}

module.exports = new CartRepository();

