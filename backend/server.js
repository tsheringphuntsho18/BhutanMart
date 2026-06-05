const express = require("express");
const dotenv = require("dotenv");

const connectDB = require("./src/config/mongodb");
const { connectRedis } = require("./src/config/redis");
const app = require("./src/app");

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to databases before accepting requests
(async () => {
  try {
    await connectDB();
    await connectRedis();
    console.log("All databases connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
})();


