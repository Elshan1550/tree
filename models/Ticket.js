const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    barcode: String,
    category: String,
    status: { type: String, default: 'pending' }
});

module.exports = mongoose.model('Ticket', TicketSchema);
