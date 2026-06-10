const jwt = require("jsonwebtoken");

// Ensure environment variables are loaded (if not already loaded in server.js)
require("dotenv").config(); 

module.exports = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Attach the user payload to the request for later use
    next();
  } catch (err) {
    console.error("TOKEN ERROR:", err.message);
    res.status(400).json({ message: "Invalid token" });
  }
};