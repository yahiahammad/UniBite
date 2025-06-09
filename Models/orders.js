// models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items: [ // Array of items within the order
    {
      menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
      quantity: { type: Number, required: true, min: 1 },
      nameAtOrder: String,      //  Store name/price at order time for historical accuracy, as menu items can change
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
  acceptedTime: { type: Date }, // New field for when the order was accepted
  pickupTime: { type: Date },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  },
  notes: String, // Optional notes from the user
});

module.exports = mongoose.model('Order', OrderSchema);