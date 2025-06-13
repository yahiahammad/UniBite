const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String, 
  imageURL: String,
  available: { type: Boolean, default: true },
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);