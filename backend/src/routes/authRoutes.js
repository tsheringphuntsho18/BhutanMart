const express = require("express");

const {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const createRateLimiter = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", createRateLimiter("login", 3), loginUser);

router.post("/logout", authMiddleware, logoutUser);

router.get("/me", authMiddleware, getCurrentUser);

module.exports = router;