const Cart = require("../models/Cart");

// ➕ ADD TO CART
exports.addToCart = async (req, res) => {
  try {
    const { name, price, image, quantity, size } = req.body;

    if (!name || !price) {
      return res.status(400).send("Missing product data");
    }

    if (!size) {
      return res.status(400).send("Size is required");
    }

    const existing = await Cart.findOne({
      name,
      size,
      user: req.user.id
    });

    if (existing) {
      existing.quantity += quantity || 1;
      await existing.save();
      return res.send("Quantity updated");
    }

    const newItem = new Cart({
      user: req.user.id,
      name,
      price,
      image,
      size,
      quantity: quantity || 1
    });

    await newItem.save();

    res.send("Added to cart");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding to cart");
  }
};


// 📦 GET CART ITEMS WITH DISCOUNT
exports.getCart = async (req, res) => {
  try {
    const items = await Cart.find({ user: req.user.id });

    let total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let discount = 0;

    // 10% discount if 2 or more products
    if (items.length >= 2) {
      discount = total * 0.10;
    }

    let finalTotal = total - discount;

    res.json({
      items,
      total,
      discount,
      finalTotal
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching cart");
  }
};


// ✏️ UPDATE CART
exports.updateCart = async (req, res) => {
  try {
    const { quantity } = req.body;

    const updated = await Cart.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { quantity },
      { new: true }
    );

    if (!updated) {
      return res.status(404).send("Item not found");
    }

    res.send("Cart updated");
  } catch (err) {
    res.status(500).send("Error updating cart");
  }
};


// ❌ REMOVE SINGLE ITEM
exports.removeCartItem = async (req, res) => {
  try {
    const deleted = await Cart.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!deleted) {
      return res.status(404).send("Item not found");
    }

    res.send("Item removed");
  } catch (err) {
    res.status(500).send("Error removing item");
  }
};


// 🧹 CLEAR ENTIRE CART
exports.clearCart = async (req, res) => {
  try {
    await Cart.deleteMany({ user: req.user.id });
    res.send("Cart cleared");
  } catch (err) {
    res.status(500).send("Error clearing cart");
  }
};