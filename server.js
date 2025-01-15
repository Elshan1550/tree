require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

mongoose.connect(process.env.DB_URI, {})
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

const Ticket = mongoose.model('Ticket', new mongoose.Schema({
    barcode: String,
    category: String,
    status: { type: String, default: 'pending' }
}));

let connections = [];

app.post('/tickets', async (req, res) => {
    const { barcode, category } = req.body;
    try {
        const existingTicket = await Ticket.findOne({ barcode });
        if (existingTicket) {
            return res.status(409).send({ message: 'A ticket with this barcode already exists.' });
        }
        const newTicket = new Ticket({ barcode, category });
        const savedTicket = await newTicket.save();
        notifyClients(); // Notify on new ticket creation
        res.status(201).send(savedTicket);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/tickets', async (req, res) => {
    try {
        const tickets = await Ticket.find();
        res.status(200).send(tickets);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/update-ticket-status', async (req, res) => {
    const { barcode } = req.body;
    try {
        const ticket = await Ticket.findOne({ barcode });
        if (ticket) {
            ticket.status = ticket.status === 'In' ? 'Out' : 'In';
            await ticket.save();
            notifyClients(); // Notify on status update
            res.status(200).send({ message: ticket.status === 'In' ? 'Welcome Back' : 'Thank You', ticket });
        } else {
            res.status(404).send({ message: 'Ticket not found' });
        }
    } catch (err) {
        res.status(500).send({ message: 'Error updating ticket', error: err });
    }
});

app.get('/long-poll-tickets', async (req, res) => {
    connections.push(res);
});

function notifyClients() {
    connections.forEach(res => {
        res.status(200).json({ message: 'Update' });
    });
    connections = []; // Clear the connections after updates
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

