/**
 * Ticket DAO - Data Access Object
 * Capa de acceso a datos para tickets de compra
 */
const Ticket = require('../models/Ticket');

class TicketDAO {
  async findById(id) {
    return await Ticket.findById(id);
  }

  async findByCode(code) {
    return await Ticket.findOne({ code });
  }

  async findByPurchaser(email) {
    return await Ticket.find({ purchaser: email }).sort({ purchase_datetime: -1 });
  }

  async findAll() {
    return await Ticket.find().sort({ purchase_datetime: -1 });
  }

  async create(ticketData) {
    const ticket = new Ticket(ticketData);
    return await ticket.save();
  }

  async delete(id) {
    return await Ticket.findByIdAndDelete(id);
  }
}

module.exports = new TicketDAO();

