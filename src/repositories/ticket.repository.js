/**
 * Ticket Repository
 * Capa intermedia entre Services y DAOs
 */
const ticketDAO = require('../dao/ticket.dao');

class TicketRepository {
  async getById(id) {
    return await ticketDAO.findById(id);
  }

  async getByCode(code) {
    return await ticketDAO.findByCode(code);
  }

  async getByPurchaser(email) {
    return await ticketDAO.findByPurchaser(email);
  }

  async getAll() {
    return await ticketDAO.findAll();
  }

  async create(ticketData) {
    return await ticketDAO.create(ticketData);
  }

  async delete(id) {
    return await ticketDAO.delete(id);
  }
}

module.exports = new TicketRepository();

