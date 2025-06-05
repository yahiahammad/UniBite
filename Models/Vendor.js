const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ['restaurant', 'cafe', 'snack-bar', 'bakery'],
    required: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    default: 'images/stores/default.jpg'
  },
  rating: {
    score: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  pickupTime: {
    type: String,
    required: [true, 'Pickup time is required'],
    default: '5-10 min'
  },
  isActive: {
    type: Boolean,
    default: false // Admin needs to approve
  },
  category: {
    type: String,
    enum: ['main-dishes', 'cafe', 'snacks', 'desserts', 'beverages'],
    required: true
  },
  businessHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
  },
  contact: {
    phone: String,
    email: String
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String
  },
  featured: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  totalOrders: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
VendorSchema.index({ slug: 1 });
VendorSchema.index({ category: 1 });
VendorSchema.index({ isActive: 1 });
VendorSchema.index({ 'rating.score': -1 });
VendorSchema.index({ tags: 1 });

// Virtual for menu items
VendorSchema.virtual('menuItems', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'vendorId'
});

// Virtual for orders
VendorSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'vendorId'
});

// Virtual for current status (open/closed)
VendorSchema.virtual('isOpen').get(function() {
  if (!this.isActive) return false;

  const now = new Date();
  const currentDay = now.toLocaleLowerCase();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  const todayHours = this.businessHours[currentDay];
  if (!todayHours || todayHours.closed) return false;

  return currentTime >= todayHours.open && currentTime <= todayHours.close;
});

// Pre-save middleware to generate slug
VendorSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
  }
  next();
});

// Method to update rating
VendorSchema.methods.updateRating = async function(newRating) {
  const totalScore = this.rating.score * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.score = Number((totalScore / this.rating.count).toFixed(1));
  return await this.save();
};

// Method to get vendor stats
VendorSchema.methods.getStats = async function() {
  const MenuItem = mongoose.model('MenuItem');
  const Order = mongoose.model('Order');

  const menuItemsCount = await MenuItem.countDocuments({ vendorId: this._id });
  const ordersCount = await Order.countDocuments({ vendorId: this._id });
  const pendingOrders = await Order.countDocuments({
    vendorId: this._id,
    status: { $in: ['pending', 'confirmed', 'preparing'] }
  });

  return {
    menuItems: menuItemsCount,
    totalOrders: ordersCount,
    pendingOrders: pendingOrders,
    rating: this.rating,
    revenue: this.totalRevenue
  };
};

// Static method to find active vendors
VendorSchema.statics.findActive = function() {
  return this.find({ isActive: true, approvalStatus: 'approved' });
};

// Static method to search vendors
VendorSchema.statics.search = function(query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    isActive: true,
    approvalStatus: 'approved',
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { tags: { $in: [searchRegex] } },
      { category: searchRegex }
    ]
  });
};

// Static method to find by category
VendorSchema.statics.findByCategory = function(category) {
  return this.find({
    category: category,
    isActive: true,
    approvalStatus: 'approved'
  });
};

// Static method to get featured vendors
VendorSchema.statics.getFeatured = function() {
  return this.find({
    featured: true,
    isActive: true,
    approvalStatus: 'approved'
  }).limit(6);
};

module.exports = mongoose.model('Vendor', VendorSchema);