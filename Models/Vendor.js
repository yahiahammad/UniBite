const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  openingHours: String,
  contactInfo: String,
  logoURL: String, 
  tags: [String], // e.g., ['Healthy', 'fast food']
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model('Vendor', VendorSchema);