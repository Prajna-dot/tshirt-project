const Review = require("../models/Review");
const Product = require("../models/Product");

// Helper function to update product ratings
async function updateProductRatings(productId) {
  const reviews = await Review.find({ productId });
  const totalReviews = reviews.length;
  
  if (totalReviews === 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
    return;
  }

  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = sum / totalReviews;

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((review) => {
    distribution[review.rating]++;
  });

  await Product.findByIdAndUpdate(productId, {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    ratingDistribution: distribution,
  });
}

// 📝 GET REVIEWS FOR A PRODUCT
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = "newest" } = req.query;

    // Clean up console logs - only show product ID
    console.log("Fetching reviews for product:", productId);
    
    // Only log user if authenticated (remove the undefined spam)
    if (req.user && req.user.id) {
      console.log("Authenticated user:", req.user.id);
    }

    let sortOption = {};
    if (sort === "newest") sortOption = { createdAt: -1 };
    else if (sort === "oldest") sortOption = { createdAt: 1 };
    else if (sort === "highest") sortOption = { rating: -1 };
    else if (sort === "lowest") sortOption = { rating: 1 };
    else if (sort === "helpful") sortOption = { helpful: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ productId })
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ productId });

    // Check if current user has reviewed (only if logged in)
    let userReview = null;
    if (req.user && req.user.id) {
      userReview = await Review.findOne({
        productId: productId,
        userId: req.user.id,
      }).select('_id rating createdAt');
      
      if (userReview) {
        console.log("User has existing review:", userReview._id);
      }
    }

    res.json({
      reviews,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      userReview: userReview ? { 
        id: userReview._id, 
        rating: userReview.rating,
        createdAt: userReview.createdAt 
      } : null,
    });
  } catch (err) {
    console.error("Error in getProductReviews:", err);
    res.status(500).json({ message: "Error fetching reviews" });
  }
};

// ➕ ADD REVIEW
exports.addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;
    const userName = req.user.name || req.user.email;

    // Validation
    if (!rating || !title || !comment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    // Create review
    const review = new Review({
      productId,
      userId,
      userName,
      rating,
      title,
      comment,
      verified: true,
    });

    await review.save();
    console.log(`✅ Review added: ${review._id} for product ${productId} by user ${userId}`);

    // Update product ratings
    await updateProductRatings(productId);

    res.status(201).json({
      message: "Review added successfully",
      review,
    });
  } catch (err) {
    console.error("Error in addReview:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }
    res.status(500).json({ message: "Error adding review" });
  }
};

// ✏️ EDIT REVIEW
exports.editReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check ownership
    if (review.userId.toString() !== userId) {
      return res.status(403).json({ message: "You can only edit your own reviews" });
    }

    // Update fields
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;

    await review.save();
    console.log(`✅ Review updated: ${reviewId} by user ${userId}`);

    // Update product ratings
    await updateProductRatings(review.productId);

    res.json({
      message: "Review updated successfully",
      review,
    });
  } catch (err) {
    console.error("Error in editReview:", err);
    res.status(500).json({ message: "Error updating review" });
  }
};

// ❌ DELETE REVIEW
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check ownership
    if (review.userId.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete your own reviews" });
    }

    const productId = review.productId;
    await review.deleteOne();
    console.log(`✅ Review deleted: ${reviewId} by user ${userId}`);

    // Update product ratings
    await updateProductRatings(productId);

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("Error in deleteReview:", err);
    res.status(500).json({ message: "Error deleting review" });
  }
};

// 👍 MARK REVIEW AS HELPFUL
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Initialize helpfulUsers array if it doesn't exist
    if (!review.helpfulUsers) {
      review.helpfulUsers = [];
    }

    // Check if user already marked helpful
    const alreadyHelpful = review.helpfulUsers.includes(userId);
    
    if (alreadyHelpful) {
      // Remove helpful
      review.helpfulUsers = review.helpfulUsers.filter(
        (id) => id.toString() !== userId
      );
      review.helpful = Math.max(0, (review.helpful || 0) - 1);
      console.log(`👎 User ${userId} removed helpful from review ${reviewId}`);
    } else {
      // Add helpful
      review.helpfulUsers.push(userId);
      review.helpful = (review.helpful || 0) + 1;
      console.log(`👍 User ${userId} marked helpful on review ${reviewId}`);
    }

    await review.save();

    res.json({ message: "Helpful status updated", helpful: review.helpful });
  } catch (err) {
    console.error("Error in markHelpful:", err);
    res.status(500).json({ message: "Error updating helpful status" });
  }
};