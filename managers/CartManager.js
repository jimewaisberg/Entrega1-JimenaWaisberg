// managers/CartManager.js
const fs = require('fs').promises;
const path = require('path');

class CartManager {
  constructor(filename = 'data/carts.json') {
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
    if (!items || items.length === 0) return 1;
    const numericIds = items.map(it => Number(it.id)).filter(n => Number.isFinite(n));
    if (numericIds.length) {
      const max = Math.max(...numericIds);
      return max + 1;
    }
    return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  async createCart() {
    const items = await this.readFile();
    const id = await this.generateId(items);
    const cart = { id, products: [] };
    items.push(cart);
    await this.writeFile(items);
    return cart;
  }

  async getCartById(cid) {
    const items = await this.readFile();
    return items.find(c => String(c.id) === String(cid)) || null;
  }

  async addProductToCart(cid, pid, quantity = 1) {
    const items = await this.readFile();
    const index = items.findIndex(c => String(c.id) === String(cid));
    if (index === -1) return null;

    const cart = items[index];
    const prodIndex = cart.products.findIndex(p => String(p.product) === String(pid));
    if (prodIndex === -1) {
      cart.products.push({ product: String(pid), quantity: Number(quantity) });
    } else {
      cart.products[prodIndex].quantity = Number(cart.products[prodIndex].quantity) + Number(quantity);
    }

    items[index] = cart;
    await this.writeFile(items);
    return cart;
  }
}

module.exports = CartManager;
