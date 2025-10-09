const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dataPath = path.join(__dirname, '..', 'data', 'productos.json');

const ensureFile = () => {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '[]', 'utf8');
  }
};

const getProducts = () => {
  ensureFile();
  const jsonData = fs.readFileSync(dataPath, 'utf8');
  try {
    return JSON.parse(jsonData || '[]');
  } catch (err) {
    return [];
  }
};

const saveProducts = (data) => {
  ensureFile();
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
};

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

const addProduct = (productData) => {
  // basic validations and normalization
  const title = productData.title !== undefined ? String(productData.title).trim() : '';
  if (!title) throw validationError('El campo "title" es obligatorio.');

  const priceRaw = productData.price !== undefined ? productData.price : 0;
  const price = Number(priceRaw);
  if (Number.isNaN(price) || price < 0) throw validationError('El campo "price" debe ser un número mayor o igual a 0.');

  const stockRaw = productData.stock !== undefined ? productData.stock : 0;
  const stock = Number(stockRaw);
  if (!Number.isInteger(stock) || stock < 0) throw validationError('El campo "stock" debe ser un entero mayor o igual a 0.');

  const newProduct = {
    id: uuidv4(),
    title,
    description: productData.description !== undefined ? String(productData.description) : '',
    code: productData.code !== undefined ? String(productData.code) : '',
    price,
    status: productData.status !== undefined ? !!productData.status : true,
    stock,
    category: productData.category !== undefined ? String(productData.category) : '',
    thumbnails: normalizeThumbnails(productData.thumbnails)
  };

  const products = getProducts();
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
};

const updateProduct = (pid, body) => {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === pid);
  if (idx === -1) return null;

  // validate provided fields only
  if (body.title !== undefined) {
    const t = String(body.title).trim();
    if (!t) throw validationError('El campo "title" no puede estar vacío.');
    body.title = t;
  }
  if (body.price !== undefined) {
    const p = Number(body.price);
    if (Number.isNaN(p) || p < 0) throw validationError('El campo "price" debe ser un número mayor o igual a 0.');
    body.price = p;
  }
  if (body.stock !== undefined) {
    const s = Number(body.stock);
    if (!Number.isInteger(s) || s < 0) throw validationError('El campo "stock" debe ser un entero mayor o igual a 0.');
    body.stock = s;
  }
  if (body.thumbnails !== undefined) {
    body.thumbnails = normalizeThumbnails(body.thumbnails);
  }

  const updated = { ...products[idx], ...body, id: products[idx].id };
  products[idx] = updated;
  saveProducts(products);
  return updated;
};

const deleteProduct = (pid) => {
  let products = getProducts();
  const exists = products.some(p => p.id === pid);
  products = products.filter(p => p.id !== pid);
  saveProducts(products);
  return exists;
};

module.exports = {
  getProducts,
  saveProducts,
  addProduct,
  updateProduct,
  deleteProduct
};
