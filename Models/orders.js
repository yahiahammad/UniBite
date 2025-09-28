const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items: [ 
    {
      menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
      quantity: { type: Number, required: true, min: 1 },
      nameAtOrder: String,      
      priceAtOrder: Number,
    }
  ],
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready for pickup', 'picked up', 'cancelled'],
    default: 'pending',
  },
  orderTime: { type: Date, default: Date.now },
  acceptedTime: { type: Date }, 
  pickupTime: { type: Date },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  },
  // Payment provider metadata
  paymentProvider: { type: String },
  providerOrderId: { type: String },
  paymentKey: { type: String },
  transactionId: { type: String },

  notes: String,
  reviewed: { type: Boolean, default: false }, 
});

module.exports = mongoose.model('Order', OrderSchema);