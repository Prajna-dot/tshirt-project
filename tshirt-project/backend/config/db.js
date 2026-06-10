// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');

// Create an async function to connect to the database
const connectDB = async () => {
  try {
    // Use the MONGO_URI from the .env file
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1); // Exit the process if connection fails
  }
};

// Export the function so it can be used in server.js
module.exports = connectDB;