const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ticketSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    default: () => uuidv4()
  },
  purchase_datetime: {
    type: Date,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  },
  purchaser: {
    type: String,
    required: true // email del comprador
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    title: String,
    price: Number,
    quantity: Number
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Ticket', ticketSchema);

