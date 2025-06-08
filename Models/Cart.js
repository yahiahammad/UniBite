const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [{
        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuItem',
            required: true
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
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
            min: 1,
            default: 1
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
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    totalItems: {
        type: Number,
        default: 0
    },
    totalPrice: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for automatic cleanup of expired carts
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
CartSchema.index({ userId: 1 });

// Virtual for unique vendors in cart
CartSchema.virtual('uniqueVendors').get(function() {
    const vendorIds = [...new Set(this.items.map(item => item.vendorId.toString()))];
    return vendorIds.length;
});

// Virtual for cart summary
CartSchema.virtual('summary').get(function() {
    return {
        totalItems: this.totalItems,
        totalPrice: this.totalPrice,
        uniqueVendors: this.uniqueVendors,
        isEmpty: this.items.length === 0
    };
});

// Pre-save middleware to calculate totals
CartSchema.pre('save', function(next) {
    // Calculate item subtotals
    this.items.forEach(item => {
        const customizationPrice = item.customizations.reduce((sum, custom) => sum + custom.price, 0);
        item.subtotal = (item.price + customizationPrice) * item.quantity;
    });

    // Calculate cart totals
    this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.totalPrice = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.lastUpdated = new Date();

    next();
});

// Method to add item to cart
CartSchema.methods.addItem = async function(menuItem, quantity = 1, customizations = []) {
    const existingItemIndex = this.items.findIndex(item =>
        item.menuItemId.toString() === menuItem._id.toString() &&
        JSON.stringify(item.customizations) === JSON.stringify(customizations)
    );

    if (existingItemIndex > -1) {
        // Update existing item quantity
        this.items[existingItemIndex].quantity += quantity;
    } else {
        // Add new item
        this.items.push({
            menuItemId: menuItem._id,
            vendorId: menuItem.vendorId,
            name: menuItem.name,
            price: menuItem.price,
            quantity: quantity,
            customizations: customizations
        });
    }

    return await this.save();
};

// Method to update item quantity
CartSchema.methods.updateItemQuantity = async function(menuItemId, quantity, customizations = []) {
    const itemIndex = this.items.findIndex(item =>
        item.menuItemId.toString() === menuItemId.toString() &&
        JSON.stringify(item.customizations) === JSON.stringify(customizations)
    );

    if (itemIndex === -1) {
        throw new Error('Item not found in cart');
    }

    if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        this.items.splice(itemIndex, 1);
    } else {
        this.items[itemIndex].quantity = quantity;
    }

    return await this.save();
};

// Method to remove item from cart
CartSchema.methods.removeItem = async function(menuItemId, customizations = []) {
    this.items = this.items.filter(item =>
        !(item.menuItemId.toString() === menuItemId.toString() &&
            JSON.stringify(item.customizations) === JSON.stringify(customizations))
    );

    return await this.save();
};

// Method to clear cart
CartSchema.methods.clear = async function() {
    this.items = [];
    return await this.save();
};

// Method to get cart with populated menu items
CartSchema.methods.getPopulated = async function() {
    return await this.populate({
        path: 'items.menuItemId',
        select: 'name price imageURL available dietaryLabels'
    }).populate({
        path: 'items.vendorId',
        select: 'name slug location pickupTime'
    });
};

// Method to validate cart items (check availability, prices)
CartSchema.methods.validateItems = async function() {
    const MenuItem = mongoose.model('MenuItem');
    const validationErrors = [];

    for (let i = 0; i < this.items.length; i++) {
        const cartItem = this.items[i];
        const menuItem = await MenuItem.findById(cartItem.menuItemId);

        if (!menuItem) {
            validationErrors.push({
                itemId: cartItem.menuItemId,
                error: 'Item no longer exists'
            });
            continue;
        }

        if (!menuItem.available) {
            validationErrors.push({
                itemId: cartItem.menuItemId,
                error: 'Item is currently unavailable'
            });
        }

        if (menuItem.price !== cartItem.price) {
            validationErrors.push({
                itemId: cartItem.menuItemId,
                error: 'Price has changed',
                oldPrice: cartItem.price,
                newPrice: menuItem.price
            });
        }
    }

    return validationErrors;
};

// Method to convert cart to order format
CartSchema.methods.toOrderFormat = async function() {
    const validationErrors = await this.validateItems();
    if (validationErrors.length > 0) {
        throw new Error('Cart contains invalid items: ' + JSON.stringify(validationErrors));
    }

    return {
        items: this.items.map(item => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            customizations: item.customizations,
            subtotal: item.subtotal
        })),
        orderSummary: {
            subtotal: this.totalPrice,
            tax: 0, // Calculate based on business rules
            deliveryFee: 0, // No delivery for pickup orders
            discount: 0,
            total: this.totalPrice
        }
    };
};

// Static method to find or create cart for user
CartSchema.statics.findOrCreateForUser = async function(userId) {
    let cart = await this.findOne({ userId: userId });

    if (!cart) {
        cart = new this({ userId: userId });
        await cart.save();
    }

    return cart;
};

// Static method to cleanup expired carts
CartSchema.statics.cleanupExpired = async function() {
    const result = await this.deleteMany({
        expiresAt: { $lt: new Date() }
    });

    return result.deletedCount;
};

// Static method to get cart stats
CartSchema.statics.getStats = async function() {
    return await this.aggregate([
        {
            $group: {
                _id: null,
                totalCarts: { $sum: 1 },
                averageItems: { $avg: '$totalItems' },
                averageValue: { $avg: '$totalPrice' },
                emptyCartsCount: {
                    $sum: {
                        $cond: [{ $eq: ['$totalItems', 0] }, 1, 0]
                    }
                }
            }
        }
    ]);
};

module.exports = mongoose.model('Cart', CartSchema);