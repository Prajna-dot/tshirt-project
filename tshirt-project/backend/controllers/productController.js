const Product = require("../models/Product");

// 📦 GET ALL PRODUCTS
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).send("Error fetching products");
  }
};


// 🔥 GET SINGLE PRODUCT (IMPORTANT FIX)
exports.getProductById = async (req, res) => {
  try {
    const id = req.params.id;

    // ✅ prevent crash if invalid id
    if (!id || id.length !== 24) {
      return res.status(400).send("Invalid ID");
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).send("Product not found");
    }
    // Include rating info
    const productWithRating = {
      ...product.toObject(),
      averageRating: product.averageRating || 0,
      totalReviews: product.totalReviews || 0,
      ratingDistribution: product.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    res.json(productWithRating);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
};

    


// ➕ ADD PRODUCT (NO DUPLICATES)
exports.addProduct = async (req, res) => {
  try {
    const exists = await Product.findOne({
      name: req.body.name,
      brand: req.body.brand,
      color:req.body.color
    });

    if (exists) {
      return res.status(400).send("Product already exists");
    }

    const newProduct = new Product(req.body);
    await newProduct.save();

    res.send("Product added successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
};


// ✏️ UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).send("Product not found");
    }

    res.send("Product updated");
  } catch (err) {
    res.status(500).send("Update failed");
  }
};


// ❌ DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).send("Product not found");
    }

    res.send("Product deleted");
  } catch (err) {
    res.status(500).send("Delete failed");
  }
};