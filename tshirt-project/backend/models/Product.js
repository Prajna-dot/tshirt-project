const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: Number,
    image: String,
    images: [String],
    color: String,
    category: String,
    description: String,
    // Add rating fields with defaults
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    ratingDistribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// 🔥 MAKE UNIQUE COMBINATION
productSchema.index({ name: 1, brand: 1 }, { unique: true });

module.exports = mongoose.model("Product", productSchema);