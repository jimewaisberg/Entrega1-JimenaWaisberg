/**
 * Product Repository
 * Capa intermedia entre Services y DAOs
 */
const productDAO = require('../dao/product.dao');

class ProductRepository {
  async getById(id) {
    return await productDAO.findById(id);
  }

  async getAll() {
    return await productDAO.findAll();
  }

  async getPaginated(filter = {}, options = {}) {
    return await productDAO.findPaginated(filter, options);
  }

  async create(productData) {
    return await productDAO.create(productData);
  }

  async update(id, productData) {
    return await productDAO.update(id, productData);
  }

  async delete(id) {
    return await productDAO.delete(id);
  }

  async updateStock(id, quantity) {
    return await productDAO.updateStock(id, quantity);
  }

  async getByCode(code) {
    return await productDAO.findByCode(code);
  }
}

module.exports = new ProductRepository();

