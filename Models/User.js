const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false }, // Password is not selected by default
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

// Pre-save hook to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);