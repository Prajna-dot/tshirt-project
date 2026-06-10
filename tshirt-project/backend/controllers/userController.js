const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ✅ SIGNUP
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 🔹 Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 🔹 Check existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 🔹 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Save user
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    console.log("✅ User registered:", email);

    res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    console.log("❌ SIGNUP ERROR:", err);
    res.status(500).json({ message: "Signup failed" });
  }
};


// ✅ LOGIN (UPDATED WITH JWT)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔹 Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    console.log("🔍 Login attempt:", email);

    // 🔹 Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🔹 Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    console.log("Match result:", isMatch);

    if (!isMatch) {
      console.log("❌ Password mismatch");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🔐 🔥 GENERATE JWT TOKEN
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.name 
      },
       process.env.JWT_SECRET || "secretkey", // 👉 later move to .env
      { expiresIn: "1d" }
    );

    console.log("✅ Login successful");

    // ✅ SEND TOKEN + USER DATA
    res.status(200).json({
      message: "Login success",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.log("❌ LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

// ✅ GET SAVED ADDRESS
exports.getAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("address name");
    res.json(user?.address || {});
  } catch (err) {
    res.status(500).json({ message: "Error fetching address" });
  }
};

// ✅ SAVE ADDRESS
exports.saveAddress = async (req, res) => {
  try {
    const { fullName, phone, street, city, state, pincode } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      address: { fullName, phone, street, city, state, pincode }
    });

    res.json({ message: "Address saved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error saving address" });
  }
};