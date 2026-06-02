const express = require("express");
const dotenv = require("dotenv");

const connectDB = require("./src/config/mongodb");
const { connectRedis } = require("./src/config/redis");
const app = require("./src/app");

dotenv.config();

// Connect to databases
(async () => {
  try {
    await connectDB();
    await connectRedis();
    console.log("All databases connected");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
})();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

