const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  addToCart,
  getCart,
  updateCart,
  removeCartItem,
  clearCart
} = require("../controllers/cartController");

// ✅ APPLY AUTH PROPERLY
router.post("/", auth, addToCart);
router.get("/", auth, getCart);
router.put("/:id", auth, updateCart);
router.delete("/clear", auth, clearCart);
router.delete("/:id", auth, removeCartItem);

module.exports = router;