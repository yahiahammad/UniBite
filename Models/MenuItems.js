const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  // vendorId is the reference to the 'Vendor' document
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  }, // "Sandwiches", "Beverages", "Main Dishes", etc.
  imageURL: {
    type: String,
    default: 'images/menu/default-item.jpg'
  },
  dietaryLabels: [{
    type: String,
    trim: true
  }], // ['Skimmed milk', 'sugar-free', 'vegetarian', 'vegan', 'gluten-free']
  available: {
    type: Boolean,
    default: true
  },
  prepTime: {
    type: Number,
    min: [0, 'Preparation time cannot be negative']
  }, // estimated minutes
  ingredients: [{
    type: String,
    trim: true
  }],
  allergens: [{
    type: String,
    enum: ['nuts', 'dairy', 'eggs', 'soy', 'wheat', 'fish', 'shellfish', 'sesame']
  }],
  nutritionInfo: {
    calories: Number,
    protein: Number, // grams
    carbs: Number,   // grams
    fat: Number,     // grams
    fiber: Number,   // grams
    sugar: Number    // grams
  },
  spiceLevel: {
    type: String,
    enum: ['none', 'mild', 'medium', 'hot', 'very-hot'],
    default: 'none'
  },
  portionSize: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra-large'],
    default: 'medium'
  },
  customizations: [{
    name: String, // e.g., "Extra cheese", "No onions"
    price: {
      type: Number,
      default: 0
    },
    available: {
      type: Boolean,
      default: true
    }
  }],
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
  orderCount: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }], // For search and filtering
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
MenuItemSchema.index({ vendorId: 1 });
MenuItemSchema.index({ category: 1 });
MenuItemSchema.index({ available: 1 });
MenuItemSchema.index({ featured: 1 });
MenuItemSchema.index({ 'rating.score': -1 });
MenuItemSchema.index({ orderCount: -1 });
MenuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for vendor information
MenuItemSchema.virtual('vendor', {
  ref: 'Vendor',
  localField: 'vendorId',
  foreignField: '_id',
  justOne: true
});

// Virtual for discounted price (if any promotions)
MenuItemSchema.virtual('discountedPrice').get(function() {
  // This can be extended to include promotion logic
  return this.price;
});

// Virtual for dietary labels display
MenuItemSchema.virtual('dietaryLabelsDisplay').get(function() {
  return this.dietaryLabels.join(', ');
});

// Pre-save middleware to update timestamps
MenuItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to update rating
MenuItemSchema.methods.updateRating = async function(newRating) {
  const totalScore = this.rating.score * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.score = Number((totalScore / this.rating.count).toFixed(1));
  return await this.save();
};

// Method to increment order count
MenuItemSchema.methods.incrementOrderCount = async function() {
  this.orderCount += 1;
  return await this.save();
};

// Method to toggle availability
MenuItemSchema.methods.toggleAvailability = async function() {
  this.available = !this.available;
  return await this.save();
};

// Method to get item with vendor info
MenuItemSchema.methods.getWithVendor = async function() {
  return await this.populate('vendor');
};

// Static method to find available items
MenuItemSchema.statics.findAvailable = function() {
  return this.find({ available: true });
};

// Static method to find by vendor
MenuItemSchema.statics.findByVendor = function(vendorId) {
  return this.find({ vendorId: vendorId });
};

// Static method to find by category
MenuItemSchema.statics.findByCategory = function(category) {
  return this.find({ category: category, available: true });
};

// Static method to search items
MenuItemSchema.statics.search = function(query) {
  return this.find({
    $text: { $search: query },
    available: true
  }).sort({ score: { $meta: 'textScore' } });
};

// Static method to get popular items
MenuItemSchema.statics.getPopular = function(limit = 10) {
  return this.find({ available: true })
      .sort({ orderCount: -1, 'rating.score': -1 })
      .limit(limit);
};

// Static method to get featured items
MenuItemSchema.statics.getFeatured = function() {
  return this.find({ featured: true, available: true });
};

// Static method to filter by dietary requirements
MenuItemSchema.statics.filterByDietary = function(dietaryRequirements) {
  return this.find({
    dietaryLabels: { $in: dietaryRequirements },
    available: true
  });
};

// Static method to filter by price range
MenuItemSchema.statics.filterByPriceRange = function(minPrice, maxPrice) {
  return this.find({
    price: { $gte: minPrice, $lte: maxPrice },
    available: true
  });
};

module.exports = mongoose.model('MenuItem', MenuItemSchema);