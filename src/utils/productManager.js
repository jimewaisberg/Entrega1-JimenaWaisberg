const Product = require('../models/Product');

// Validation helper - throws Error with isValidation=true when invalid
const validationError = (message) => {
  const err = new Error(message);
  err.isValidation = true;
  return err;
};

const normalizeThumbnails = (thumbnails) => {
  if (Array.isArray(thumbnails)) return thumbnails.map(s => String(s).trim()).filter(Boolean);
  if (!thumbnails) return [];
  // if string, split by comma
  if (typeof thumbnails === 'string') {
    return thumbnails.split(',').map(s => s.trim()).filter(Boolean);
  }
  // fallback - try to stringify
  return [String(thumbnails)];
};

// Obtener todos los productos (para compatibilidad, ahora usa async/await)
const getProducts = async () => {
  try {
    return await Product.find({});
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

// Obtener productos con paginación, filtros y ordenamiento
const getProductsPaginated = async (options = {}) => {
  try {
    const {
      limit = 10,
      page = 1,
      sort = null, // 'asc' o 'desc'
      query = null // filtro por categoría o disponibilidad
    } = options;

    // Construir filtro de búsqueda
    const filter = {};
    if (query) {
      // Si query contiene 'category:', buscar por categoría
      if (query.toLowerCase().startsWith('category:')) {
        const category = query.replace(/^category:\s*/i, '').trim();
        if (category) {
          filter.category = { $regex: category, $options: 'i' };
        }
      }
      // Si query contiene 'status:', buscar por disponibilidad
      else if (query.toLowerCase().startsWith('status:')) {
        const statusStr = query.replace(/^status:\s*/i, '').trim().toLowerCase();
        filter.status = statusStr === 'true' || statusStr === 'available' || statusStr === '1';
      }
      // Búsqueda general por título o descripción
      else {
        filter.$or = [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } }
        ];
      }
    }

    // Construir sort
    const sortOption = {};
    if (sort === 'asc') {
      sortOption.price = 1;
    } else if (sort === 'desc') {
      sortOption.price = -1;
    }

    // Calcular skip
    const skip = (page - 1) * limit;

    // Obtener productos y total
    const [products, totalDocs] = await Promise.all([
      Product.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    // Calcular paginación
    const totalPages = Math.ceil(totalDocs / limit);
    const hasPrevPage = page > 1;
    const hasNextPage = page < totalPages;

    return {
      products,
      pagination: {
        totalDocs,
        limit,
        totalPages,
        page,
        hasPrevPage,
        hasNextPage,
        prevPage: hasPrevPage ? page - 1 : null,
        nextPage: hasNextPage ? page + 1 : null
      }
    };
  } catch (error) {
    console.error('Error getting paginated products:', error);
    throw error;
  }
};

// Agregar producto
const addProduct = async (productData) => {
  // Validaciones básicas
  const title = productData.title !== undefined ? String(productData.title).trim() : '';
  if (!title) throw validationError('El campo "title" es obligatorio.');

  const priceRaw = productData.price !== undefined ? productData.price : 0;
  const price = Number(priceRaw);
  if (Number.isNaN(price) || price < 0) throw validationError('El campo "price" debe ser un número mayor o igual a 0.');

  const stockRaw = productData.stock !== undefined ? productData.stock : 0;
  const stock = Number(stockRaw);
  if (!Number.isInteger(stock) || stock < 0) throw validationError('El campo "stock" debe ser un entero mayor o igual a 0.');

  const newProductData = {
    title,
    description: productData.description !== undefined ? String(productData.description) : '',
    code: productData.code !== undefined ? String(productData.code) : '',
    price,
    status: productData.status !== undefined ? !!productData.status : true,
    stock,
    category: productData.category !== undefined ? String(productData.category) : '',
    thumbnails: normalizeThumbnails(productData.thumbnails)
  };

  try {
    const newProduct = new Product(newProductData);
    await newProduct.save();
    return newProduct.toObject();
  } catch (error) {
    console.error('Error adding product:', error);
    if (error.name === 'ValidationError') {
      throw validationError(Object.values(error.errors).map(e => e.message).join(', '));
    }
    throw error;
  }
};

// Actualizar producto
const updateProduct = async (pid, body) => {
  try {
    // Validaciones solo de campos proporcionados
    const updateData = {};
    
    if (body.title !== undefined) {
      const t = String(body.title).trim();
      if (!t) throw validationError('El campo "title" no puede estar vacío.');
      updateData.title = t;
    }
    if (body.price !== undefined) {
      const p = Number(body.price);
      if (Number.isNaN(p) || p < 0) throw validationError('El campo "price" debe ser un número mayor o igual a 0.');
      updateData.price = p;
    }
    if (body.stock !== undefined) {
      const s = Number(body.stock);
      if (!Number.isInteger(s) || s < 0) throw validationError('El campo "stock" debe ser un entero mayor o igual a 0.');
      updateData.stock = s;
    }
    if (body.description !== undefined) updateData.description = String(body.description);
    if (body.code !== undefined) updateData.code = String(body.code);
    if (body.status !== undefined) updateData.status = !!body.status;
    if (body.category !== undefined) updateData.category = String(body.category);
    if (body.thumbnails !== undefined) {
      updateData.thumbnails = normalizeThumbnails(body.thumbnails);
    }

    const updated = await Product.findByIdAndUpdate(pid, updateData, { new: true, runValidators: true });
    if (!updated) return null;
    return updated.toObject();
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.name === 'ValidationError') {
      throw validationError(Object.values(error.errors).map(e => e.message).join(', '));
    }
    throw error;
  }
};

// Eliminar producto
const deleteProduct = async (pid) => {
  try {
    const result = await Product.findByIdAndDelete(pid);
    return !!result;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Obtener producto por ID
const getProductById = async (pid) => {
  try {
    const product = await Product.findById(pid).lean();
    return product;
  } catch (error) {
    console.error('Error getting product by id:', error);
    return null;
  }
};

module.exports = {
  getProducts,
  getProductsPaginated,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductById
};
