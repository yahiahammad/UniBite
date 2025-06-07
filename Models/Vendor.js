const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  description: String,
  openingHours: String,
  contactInfo: String,
  logoURL: String, 
  tags: [String], // e.g., ['Healthy', 'fast food']
  isActive: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['open', 'busy', 'closed'],
    default: 'closed'
  },
  rating: {
    score: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  averagePickupTime: { type: Number, default: 10 } // Represents average pickup time in minutes
});

// Pre-save middleware to ensure email is lowercase
VendorSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Vendor', VendorSchema);