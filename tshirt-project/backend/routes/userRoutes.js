const express = require("express");
const router = express.Router();
const { signup, login, getAddress, saveAddress } = require("../controllers/userController");
const auth = require("../middleware/auth");

router.post("/signup", signup);
router.post("/login", login);
router.get("/address", auth, getAddress);
router.put("/address", auth, saveAddress);

module.exports = router;