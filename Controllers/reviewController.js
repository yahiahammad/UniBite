const Review = require('../Models/Review');
const Order = require('../Models/orders');


exports.createReview = async (req, res) => {
  try {
    const { vendorId, rating, comment, orderId } = req.body;
    const userId = req.user.id;

    
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(400).json({ message: 'Order not found or not authorized.' });
    }

    
    const existing = await Review.findOne({ userId, vendorId, orderId });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this order.' });
    }

    const review = new Review({ userId, vendorId, rating, comment, orderId });
    await review.save();

    
    await Order.findByIdAndUpdate(orderId, { reviewed: true });

    
    const allReviews = await Review.find({ vendorId });
    const reviewCount = allReviews.length;
    const avgRating = reviewCount > 0 ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) : 0;
    const Vendor = require('../Models/Vendor');
    await Vendor.findByIdAndUpdate(vendorId, {
      $set: { 'rating.score': avgRating, 'rating.count': reviewCount }
    });

    res.status(201).json({ message: 'Review submitted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error submitting review', error: err.message });
  }
};


exports.getVendorReviews = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const reviews = await Review.find({ vendorId }).populate('userId', 'name');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews', error: err.message });
  }
};
