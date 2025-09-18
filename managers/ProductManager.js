// managers/ProductManager.js
const fs = require('fs').promises;
const path = require('path');

class ProductManager {
  constructor(filename = 'data/products.json') {
    this.filePath = path.resolve(filename);
  }

  async readFile() {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (err) {
      if (err.code === 'ENOENT') {
        await fs.writeFile(this.filePath, '[]', 'utf8');
        return [];
      }
      throw err;
    }
  }

  async writeFile(data) {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async generateId(items) {
    // Generador robusto: si hay ids numéricos sigue con incremento, si no, genera string único
    if (!items || items.length === 0) return 1;
    const numericIds = items.map(it => Number(it.id)).filter(n => Number.isFinite(n));
    if (numericIds.length) {
      const max = Math.max(...numericIds);
      return max + 1;
    }
    // fallback: id string único
    return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  async getAll() {
    return await this.readFile();
  }

  async getById(pid) {
    const items = await this.readFile();
    return items.find(p => String(p.id) === String(pid)) || null;
  }

  async add(productData) {
    const items = await this.readFile();
    const id = await this.generateId(items);

    const newProduct = {
      id,
      title: productData.title || '',
      description: productData.description || '',
      code: productData.code || '',
      price: Number(productData.price || 0),
      status: productData.status === undefined ? true : Boolean(productData.status),
      stock: Number(productData.stock || 0),
      category: productData.category || '',
      thumbnails: Array.isArray(productData.thumbnails) ? productData.thumbnails : []
    };

    items.push(newProduct);
    await this.writeFile(items);
    return newProduct;
  }

  async update(pid, fields) {
    const items = await this.readFile();
    const index = items.findIndex(p => String(p.id) === String(pid));
    if (index === -1) return null;

    const id = items[index].id; // preservar id
    const updated = { ...items[index], ...fields, id };

    // Normalizar tipos si vienen
    if (fields.price !== undefined) updated.price = Number(fields.price);
    if (fields.stock !== undefined) updated.stock = Number(fields.stock);
    if (fields.status !== undefined) updated.status = Boolean(fields.status);
    if (fields.thumbnails !== undefined) updated.thumbnails = Array.isArray(fields.thumbnails) ? fields.thumbnails : items[index].thumbnails;

    items[index] = updated;
    await this.writeFile(items);
    return updated;
  }

  async delete(pid) {
    const items = await this.readFile();
    const index = items.findIndex(p => String(p.id) === String(pid));
    if (index === -1) return false;
    items.splice(index, 1);
    await this.writeFile(items);
    return true;
  }
}

module.exports = ProductManager;
