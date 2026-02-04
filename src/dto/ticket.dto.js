/**
 * Ticket DTO - Data Transfer Object
 * Estructura de datos para respuestas de tickets
 */
class TicketDTO {
  constructor(ticket) {
    this.id = ticket._id || ticket.id;
    this.code = ticket.code;
    this.purchase_datetime = ticket.purchase_datetime;
    this.amount = ticket.amount;
    this.purchaser = ticket.purchaser;
    this.products = ticket.products.map(p => ({
      product: p.product,
      title: p.title,
      price: p.price,
      quantity: p.quantity,
      subtotal: p.price * p.quantity
    }));
  }
}

module.exports = TicketDTO;

