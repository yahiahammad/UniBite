const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  rating: { type: Number, min: 1, max: 5, required: true }, // Rating from 1 to 5
  comment: String, // The review text
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Review', ReviewSchema);