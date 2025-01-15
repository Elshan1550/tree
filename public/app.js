require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.DB_URI, {})
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

// Ticket model
const Ticket = mongoose.model('Ticket', new mongoose.Schema({
    barcode: String,
    category: String,
    status: { type: String, default: 'pending' }
}));

// POST route to create a new ticket with duplicate check
app.post('/tickets', async (req, res) => {
    const { barcode, category } = req.body;
    try {
        const existingTicket = await Ticket.findOne({ barcode });
        if (existingTicket) {
            return res.status(409).send({ message: 'A ticket with this barcode already exists.' });
        }
        const newTicket = new Ticket({ barcode, category });
        const savedTicket = await newTicket.save();
        res.status(201).send(savedTicket);
    } catch (err) {
        res.status(500).send(err);
    }
});

// GET route to fetch all tickets
app.get('/tickets', async (req, res) => {
    try {
        const tickets = await Ticket.find();
        res.status(200).send(tickets);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Update Ticket Status based on current status
app.post('/update-ticket-status', async (req, res) => {
    const { barcode } = req.body;
    try {
        const ticket = await Ticket.findOne({ barcode });
        if (ticket) {
            ticket.status = ticket.status === 'In' ? 'Out' : 'In';
            await ticket.save();
            res.status(200).send({ message: ticket.status === 'In' ? 'Welcome Back' : 'Thank You', ticket });
        } else {
            res.status(404).send({ message: 'Ticket not found. Please try again.' });
        }
    } catch (err) {
        res.status(500).send({ message: 'Error updating ticket', error: err });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
