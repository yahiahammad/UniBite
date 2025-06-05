const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  accountType: {
    type: String,
    enum: ['Student', 'Admin', 'Vendor'],
    default: 'Student'
  },
  memberSince: {
    type: Date,
    default: Date.now
  },
  preferences: {
    orderUpdates: {
      type: Boolean,
      default: true
    },
    promotions: {
      type: Boolean,
      default: true
    },
    newsletter: {
      type: Boolean,
      default: false
    }
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  recentLogins: [{
    date: {
      type: Date,
      default: Date.now
    },
    location: String,
    device: String,
    ipAddress: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true
});

// Index for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ accountType: 1 });

// Virtual for account locked
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT
UserSchema.methods.generateJWT = function() {
  return jwt.sign(
      {
        id: this._id,
        email: this.email,
        accountType: this.accountType,
        name: this.name
      },
      process.env.JWT_SECRET || 'your-jwt-secret',
      {
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
  );
};

// Method to generate refresh token
UserSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
      { id: this._id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      { expiresIn: '30d' }
  );
};

// Method to record login
UserSchema.methods.recordLogin = function(loginInfo) {
  this.lastLogin = new Date();
  this.loginAttempts = 0;
  this.lockUntil = undefined;

  // Add to recent logins (keep only last 5)
  this.recentLogins.unshift({
    date: new Date(),
    location: loginInfo.location || 'Unknown',
    device: loginInfo.device || 'Unknown',
    ipAddress: loginInfo.ipAddress
  });

  // Keep only last 5 logins
  if (this.recentLogins.length > 5) {
    this.recentLogins = this.recentLogins.slice(0, 5);
  }

  return this.save();
};

// Method to handle failed login
UserSchema.methods.recordFailedLogin = function() {
  this.loginAttempts += 1;

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  }

  return this.save();
};

// Method to get public profile
UserSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    accountType: this.accountType,
    memberSince: this.memberSince,
    preferences: this.preferences,
    twoFactorEnabled: this.twoFactorEnabled,
    recentLogins: this.recentLogins,
    lastLogin: this.lastLogin,
    emailVerified: this.emailVerified
  };
};

// Static method to find by email
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
UserSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('User', UserSchema);