// scripts/updateProducts.js
const mongoose = require("mongoose");
require("dotenv").config();

// Import your Product model
const Product = require("../models/Product");

const updateExistingProducts = async () => {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check how many products exist
    const totalProducts = await Product.countDocuments();
    console.log(`📦 Found ${totalProducts} products in database`);

    if (totalProducts === 0) {
      console.log("No products to update");
      return;
    }

    // Update all products that don't have rating fields
    const result = await Product.updateMany(
      { 
        $or: [
          { averageRating: { $exists: false } },
          { totalReviews: { $exists: false } },
          { ratingDistribution: { $exists: false } }
        ]
      },
      {
        $set: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} products`);
    console.log(`📊 Matched: ${result.matchedCount} products`);
    
    // Verify the update
    const updatedProducts = await Product.find({
      averageRating: { $exists: true }
    }).limit(5);
    
    console.log("\n📝 Sample of updated products:");
    updatedProducts.forEach(product => {
      console.log(`   - ${product.name}: Rating ${product.averageRating}, ${product.totalReviews} reviews`);
    });
    
    console.log("\n✨ Migration completed successfully!");
    
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    
  } catch (error) {
    console.error("❌ Migration error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the migration
updateExistingProducts();