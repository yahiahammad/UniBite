const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  items: [{
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    customizations: [{
      name: String,
      price: {
        type: Number,
        default: 0
      }
    }],
    subtotal: {
      type: Number,
      required: true
    }
  }],
  orderSummary: {
    subtotal: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'wallet'],
    required: true
  },
  pickupTime: {
    estimated: {
      type: Date,
      required: true
    },
    actual: Date
  },
  customerNotes: String,
  vendorNotes: String,
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    ratedAt: Date
  },
  refund: {
    requested: {
      type: Boolean,
      default: false
    },
    reason: String,
    amount: Number,
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
OrderSchema.index({ userId: 1 });
OrderSchema.index({ vendorId: 1 });
OrderSchema.index({ orderId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'pickupTime.estimated': 1 });

// Virtual for user information
OrderSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for vendor information
OrderSchema.virtual('vendor', {
  ref: 'Vendor',
  localField: 'vendorId',
  foreignField: '_id',
  justOne: true
});

// Virtual for formatted order date
OrderSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for time since order
OrderSchema.virtual('timeSinceOrder').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  } else if (diffMins < 1440) {
    return `${Math.floor(diffMins / 60)} hours ago`;
  } else {
    return `${Math.floor(diffMins / 1440)} days ago`;
  }
});

// Pre-save middleware to generate order ID
OrderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderId) {
    this.orderId = 'ORD-' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

// Pre-save middleware to calculate totals
OrderSchema.pre('save', function(next) {
  // Calculate subtotal from items
  this.orderSummary.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);

  // Calculate total
  this.orderSummary.total = this.orderSummary.subtotal +
      this.orderSummary.tax +
      this.orderSummary.deliveryFee -
      this.orderSummary.discount;

  next();
});

// Method to update status
OrderSchema.methods.updateStatus = async function(newStatus, updatedBy, notes = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy: updatedBy,
    notes: notes
  });

  // Update pickup time if order is ready
  if (newStatus === 'ready') {
    this.pickupTime.actual = new Date();
  }

  return await this.save();
};

// Method to add rating
OrderSchema.methods.addRating = async function(score, comment) {
  this.rating = {
    score: score,
    comment: comment,
    ratedAt: new Date()
  };

  // Update menu item ratings
  const MenuItem = mongoose.model('MenuItem');
  for (const item of this.items) {
    const menuItem = await MenuItem.findById(item.menuItemId);
    if (menuItem) {
      await menuItem.updateRating(score);
    }
  }

  // Update vendor rating
  const Vendor = mongoose.model('Vendor');
  const vendor = await Vendor.findById(this.vendorId);
  if (vendor) {
    await vendor.updateRating(score);
  }

  return await this.save();
};

// Method to request refund
OrderSchema.methods.requestRefund = async function(reason, amount) {
  this.refund = {
    requested: true,
    reason: reason,
    amount: amount || this.orderSummary.total
  };

  return await this.save();
};

// Method to process refund
OrderSchema.methods.processRefund = async function(processedBy) {
  this.refund.processedAt = new Date();
  this.refund.processedBy = processedBy;
  this.paymentStatus = 'refunded';
  this.status = 'cancelled';

  return await this.save();
};

// Static method to find by user
OrderSchema.statics.findByUser = function(userId) {
  return this.find({ userId: userId }).sort({ createdAt: -1 });
};

// Static method to find by vendor
OrderSchema.statics.findByVendor = function(vendorId) {
  return this.find({ vendorId: vendorId }).sort({ createdAt: -1 });
};

// Static method to find pending orders
OrderSchema.statics.findPending = function() {
  return this.find({ status: { $in: ['pending', 'confirmed', 'preparing'] } });
};

// Static method to get order stats
OrderSchema.statics.getStats = async function(vendorId = null) {
  const matchStage = vendorId ? { vendorId: mongoose.Types.ObjectId(vendorId) } : {};

  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$orderSummary.total' },
        averageOrderValue: { $avg: '$orderSummary.total' },
        pendingOrders: {
          $sum: {
            $cond: [{ $in: ['$status', ['pending', 'confirmed', 'preparing']] }, 1, 0]
          }
        },
        completedOrders: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', OrderSchema);