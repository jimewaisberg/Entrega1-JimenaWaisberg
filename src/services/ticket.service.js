/**
 * Ticket Service
 * Capa de lógica de negocio para tickets
 */
const ticketRepository = require('../repositories/ticket.repository');
const TicketDTO = require('../dto/ticket.dto');

class TicketService {
  async getTicketById(id) {
    const ticket = await ticketRepository.getById(id);
    if (!ticket) return null;
    return new TicketDTO(ticket);
  }

  async getTicketByCode(code) {
    const ticket = await ticketRepository.getByCode(code);
    if (!ticket) return null;
    return new TicketDTO(ticket);
  }

  async getTicketsByPurchaser(email) {
    const tickets = await ticketRepository.getByPurchaser(email);
    return tickets.map(t => new TicketDTO(t));
  }

  async getAllTickets() {
    const tickets = await ticketRepository.getAll();
    return tickets.map(t => new TicketDTO(t));
  }

  async createTicket(ticketData) {
    const ticket = await ticketRepository.create(ticketData);
    return new TicketDTO(ticket);
  }
}

module.exports = new TicketService();

