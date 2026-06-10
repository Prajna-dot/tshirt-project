const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getProductReviews,
  addReview,
  editReview,
  deleteReview,
  markHelpful,
} = require("../controllers/reviewController");

// Public routes
router.get("/product/:productId", getProductReviews);

// Protected routes (require authentication)
router.post("/product/:productId", auth, addReview);
router.put("/:reviewId", auth, editReview);
router.delete("/:reviewId", auth, deleteReview);
router.post("/:reviewId/helpful", auth, markHelpful);

module.exports = router;