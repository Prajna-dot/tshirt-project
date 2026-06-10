const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  name: String,
  price: Number,
  image: String,
  size: String,

  quantity: {
    type: Number,
    default: 1
  }
});

module.exports = mongoose.model("Cart", cartSchema);