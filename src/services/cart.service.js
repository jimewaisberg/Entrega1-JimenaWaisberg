/**
 * Cart Service
 * Capa de lógica de negocio para carritos
 */
const cartRepository = require('../repositories/cart.repository');
const productRepository = require('../repositories/product.repository');
const ticketRepository = require('../repositories/ticket.repository');
const TicketDTO = require('../dto/ticket.dto');

class CartService {
  async getCartById(id) {
    return await cartRepository.getById(id);
  }

  async getCartByIdPopulated(id) {
    return await cartRepository.getByIdPopulated(id);
  }

  async createCart() {
    return await cartRepository.create({ products: [] });
  }

  async addProductToCart(cartId, productId, quantity = 1) {
    // Verificar que el producto existe
    const product = await productRepository.getById(productId);
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    return await cartRepository.addProduct(cartId, productId, quantity);
  }

  async removeProductFromCart(cartId, productId) {
    return await cartRepository.removeProduct(cartId, productId);
  }

  async updateProductQuantity(cartId, productId, quantity) {
    if (quantity < 1) {
      throw new Error('La cantidad debe ser mayor a 0');
    }
    return await cartRepository.updateProductQuantity(cartId, productId, quantity);
  }

  async updateCart(cartId, products) {
    // Validar que todos los productos existan
    for (const item of products) {
      const product = await productRepository.getById(item.product);
      if (!product) {
        throw new Error(`Producto ${item.product} no encontrado`);
      }
    }

    const cart = await cartRepository.getById(cartId);
    if (!cart) {
      throw new Error('Carrito no encontrado');
    }

    cart.products = products;
    return await cart.save();
  }

  async clearCart(cartId) {
    return await cartRepository.clearCart(cartId);
  }

  /**
   * Procesar compra del carrito
   * Verifica stock, genera ticket, maneja compras completas e incompletas
   */
  async purchaseCart(cartId, purchaserEmail) {
    const cart = await cartRepository.getByIdPopulated(cartId);
    if (!cart) {
      throw new Error('Carrito no encontrado');
    }

    if (cart.products.length === 0) {
      throw new Error('El carrito está vacío');
    }

    const productsToPurchase = []; // Productos con stock suficiente
    const productsNotPurchased = []; // Productos sin stock suficiente
    let totalAmount = 0;

    // Verificar stock de cada producto
    for (const item of cart.products) {
      const product = item.product;
      
      if (!product) {
        productsNotPurchased.push({
          productId: item.product,
          reason: 'Producto no encontrado'
        });
        continue;
      }

      if (product.stock >= item.quantity) {
        // Hay stock suficiente
        productsToPurchase.push({
          product: product._id,
          title: product.title,
          price: product.price,
          quantity: item.quantity
        });
        totalAmount += product.price * item.quantity;
      } else {
        // No hay stock suficiente
        productsNotPurchased.push({
          productId: product._id,
          title: product.title,
          requestedQuantity: item.quantity,
          availableStock: product.stock,
          reason: 'Stock insuficiente'
        });
      }
    }

    // Si no hay productos para comprar
    if (productsToPurchase.length === 0) {
      return {
        success: false,
        message: 'No hay productos con stock suficiente para realizar la compra',
        productsNotPurchased
      };
    }

    // Actualizar stock de productos comprados
    for (const item of productsToPurchase) {
      await productRepository.updateStock(item.product, item.quantity);
    }

    // Crear ticket
    const ticketData = {
      amount: totalAmount,
      purchaser: purchaserEmail,
      products: productsToPurchase
    };

    const ticket = await ticketRepository.create(ticketData);

    // Actualizar carrito: mantener solo productos no comprados
    const remainingProducts = cart.products.filter(item => {
      const productId = item.product._id || item.product;
      return productsNotPurchased.some(p => 
        p.productId && p.productId.toString() === productId.toString()
      );
    });

    cart.products = remainingProducts;
    await cart.save();

    return {
      success: true,
      ticket: new TicketDTO(ticket),
      productsNotPurchased: productsNotPurchased.length > 0 ? productsNotPurchased : null,
      message: productsNotPurchased.length > 0 
        ? 'Compra parcial realizada. Algunos productos no tenían stock suficiente.'
        : 'Compra realizada exitosamente'
    };
  }
}

module.exports = new CartService();

