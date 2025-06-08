const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  // vendorId is the reference to the 'Vendor' document
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String, // "Sandwiches", "Beverages"
  imageURL: String,
  available: { type: Boolean, default: true },
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);