/**
 * Product Service
 * Capa de lógica de negocio para productos
 */
const productRepository = require('../repositories/product.repository');

class ProductService {
  async getProductById(id) {
    return await productRepository.getById(id);
  }

  async getAllProducts() {
    return await productRepository.getAll();
  }

  async getProductsPaginated(options = {}) {
    const { limit = 10, page = 1, sort = null, query = null } = options;

    // Construir filtro
    const filter = {};
    if (query) {
      if (query.toLowerCase().startsWith('category:')) {
        const category = query.replace(/^category:\s*/i, '').trim();
        if (category) {
          filter.category = { $regex: category, $options: 'i' };
        }
      } else if (query.toLowerCase().startsWith('status:')) {
        const statusStr = query.replace(/^status:\s*/i, '').trim().toLowerCase();
        filter.status = statusStr === 'true' || statusStr === 'available' || statusStr === '1';
      } else {
        filter.$or = [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } }
        ];
      }
    }

    const result = await productRepository.getPaginated(filter, { limit, page, sort });

    return {
      products: result.docs,
      pagination: {
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page,
        limit: result.limit,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage
      }
    };
  }

  async createProduct(productData) {
    // Validaciones
    const requiredFields = ['title', 'description', 'code', 'price', 'stock', 'category'];
    for (const field of requiredFields) {
      if (!productData[field] && productData[field] !== 0) {
        const error = new Error(`El campo ${field} es requerido`);
        error.isValidation = true;
        throw error;
      }
    }

    // Verificar código único
    const existingProduct = await productRepository.getByCode(productData.code);
    if (existingProduct) {
      const error = new Error('Ya existe un producto con ese código');
      error.isValidation = true;
      throw error;
    }

    return await productRepository.create({
      ...productData,
      status: productData.status !== undefined ? productData.status : true
    });
  }

  async updateProduct(id, productData) {
    // Si se intenta cambiar el código, verificar que no exista
    if (productData.code) {
      const existingProduct = await productRepository.getByCode(productData.code);
      if (existingProduct && existingProduct._id.toString() !== id) {
        const error = new Error('Ya existe un producto con ese código');
        error.isValidation = true;
        throw error;
      }
    }

    return await productRepository.update(id, productData);
  }

  async deleteProduct(id) {
    const product = await productRepository.getById(id);
    if (!product) return false;
    
    await productRepository.delete(id);
    return true;
  }

  async updateStock(id, quantity) {
    return await productRepository.updateStock(id, quantity);
  }

  async checkStock(id, requiredQuantity) {
    const product = await productRepository.getById(id);
    if (!product) return { available: false, stock: 0 };
    return {
      available: product.stock >= requiredQuantity,
      stock: product.stock,
      product
    };
  }
}

module.exports = new ProductService();

