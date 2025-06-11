const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Simple string field for password as requested
  phoneNumber: String,
  userType: {
    type: String,
    enum: ['student', 'staff', 'admin'],
    default: 'student',
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: function() { return this.userType === 'admin'; },
    default: null
  },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpires: Date,
  createdAt: { type: Date, default: Date.now },
  cart: [{
    id: String,
    name: String,
    price: Number,
    image: String,
    category: String,
    quantity: Number
  }],
  newsletterSubscribed: { type: Boolean, default: false },
  lastNewsletterToggle: { type: Date, default: null }
}, {
  timestamps: true
});

// Method to compare passwords
UserSchema.methods.comparePassword = function(candidatePassword) {
  return this.password === candidatePassword;
};

module.exports = mongoose.model('User', UserSchema);