const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dataPath = path.join(__dirname, '..', 'data', 'productos.json');

const ensureFile = () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'data'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'data'));
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

const addProduct = (productData) => {
  const products = getProducts();
  const newProduct = {
    id: uuidv4(),
    title: productData.title || 'Untitled',
    description: productData.description || '',
    code: productData.code || '',
    price: productData.price !== undefined ? productData.price : 0,
    status: productData.status !== undefined ? productData.status : true,
    stock: productData.stock !== undefined ? productData.stock : 0,
    category: productData.category || '',
    thumbnails: Array.isArray(productData.thumbnails) ? productData.thumbnails : (productData.thumbnails ? productData.thumbnails.split(',').map(s => s.trim()).filter(Boolean) : [])
  };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
};

const updateProduct = (pid, body) => {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === pid);
  if (idx === -1) return null;
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
