const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,

  // ✅ Saved delivery address
  address: {
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" }
  }
});

module.exports = mongoose.model("User", userSchema);