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
  createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('User', UserSchema);