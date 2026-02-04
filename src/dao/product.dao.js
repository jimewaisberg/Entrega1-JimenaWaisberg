/**
 * Product DAO - Data Access Object
 * Capa de acceso a datos para productos
 */
const Product = require('../models/Product');

class ProductDAO {
  async findById(id) {
    return await Product.findById(id);
  }

  async findAll() {
    return await Product.find();
  }

  async findPaginated(filter = {}, options = {}) {
    const { limit = 10, page = 1, sort = null } = options;
    
    const sortOption = {};
    if (sort === 'asc') sortOption.price = 1;
    else if (sort === 'desc') sortOption.price = -1;

    return await Product.paginate(filter, {
      limit,
      page,
      sort: Object.keys(sortOption).length > 0 ? sortOption : undefined,
      lean: true
    });
  }

  async create(productData) {
    const product = new Product(productData);
    return await product.save();
  }

  async update(id, productData) {
    return await Product.findByIdAndUpdate(id, productData, { new: true });
  }

  async delete(id) {
    return await Product.findByIdAndDelete(id);
  }

  async updateStock(id, quantity) {
    return await Product.findByIdAndUpdate(
      id, 
      { $inc: { stock: -quantity } }, 
      { new: true }
    );
  }

  async findByCode(code) {
    return await Product.findOne({ code });
  }
}

module.exports = new ProductDAO();

