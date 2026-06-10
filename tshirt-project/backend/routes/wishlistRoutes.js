const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Wishlist = require("../models/Wishlist");

router.get("/", auth, async (req, res) => {
  const items = await Wishlist.find({ userId: req.user.id });
  res.json(items);
});

router.post("/", auth, async (req, res) => {
  const { productId, name, price, image } = req.body;
  const exists = await Wishlist.findOne({ userId: req.user.id, productId });
  if (exists) return res.json({ message: "Already in wishlist" });
  await Wishlist.create({ userId: req.user.id, productId, name, price, image });
  res.json({ message: "Added to wishlist" });
});
router.delete("/:id", auth, async (req, res) => {
  const deleted = await Wishlist.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!deleted) return res.status(404).json({ message: "Item not found" });
  res.json({ message: "Removed from wishlist" });
});

module.exports = router;