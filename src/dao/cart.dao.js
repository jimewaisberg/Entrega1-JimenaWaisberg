/**
 * Cart DAO - Data Access Object
 * Capa de acceso a datos para carritos
 */
const Cart = require('../models/Cart');

class CartDAO {
  async findById(id) {
    return await Cart.findById(id);
  }

  async findByIdPopulated(id) {
    return await Cart.findById(id).populate('products.product');
  }

  async findAll() {
    return await Cart.find();
  }

  async create(cartData = { products: [] }) {
    const cart = new Cart(cartData);
    return await cart.save();
  }

  async update(id, cartData) {
    return await Cart.findByIdAndUpdate(id, cartData, { new: true });
  }

  async delete(id) {
    return await Cart.findByIdAndDelete(id);
  }

  async addProduct(cartId, productId, quantity = 1) {
    const cart = await Cart.findById(cartId);
    if (!cart) return null;

    const productIndex = cart.products.findIndex(
      p => p.product.toString() === productId.toString()
    );

    if (productIndex !== -1) {
      cart.products[productIndex].quantity += quantity;
    } else {
      cart.products.push({ product: productId, quantity });
    }

    return await cart.save();
  }

  async removeProduct(cartId, productId) {
    const cart = await Cart.findById(cartId);
    if (!cart) return null;

    cart.products = cart.products.filter(
      p => p.product.toString() !== productId.toString()
    );

    return await cart.save();
  }

  async updateProductQuantity(cartId, productId, quantity) {
    const cart = await Cart.findById(cartId);
    if (!cart) return null;

    const productIndex = cart.products.findIndex(
      p => p.product.toString() === productId.toString()
    );

    if (productIndex === -1) return null;

    cart.products[productIndex].quantity = quantity;
    return await cart.save();
  }

  async clearCart(cartId) {
    const cart = await Cart.findById(cartId);
    if (!cart) return null;

    cart.products = [];
    return await cart.save();
  }
}

module.exports = new CartDAO();

