const Ticket = require('../models/Ticket');

// Generates a human-readable, sequential ticket number like TKT-1001
const generateTicketNumber = async () => {
  const lastTicket = await Ticket.findOne().sort({ createdAt: -1 }).select('ticketNo');

  let nextNumber = 1001;
  if (lastTicket && lastTicket.ticketNo) {
    const lastNumber = parseInt(lastTicket.ticketNo.split('-')[1], 10);
    if (!Number.isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }
  return `TKT-${nextNumber}`;
};

module.exports = generateTicketNumber;
