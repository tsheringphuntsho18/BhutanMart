const express = require("express");

const {
  becomeSeller,
  getSellerProfile,
  updateSellerProfile,
  getAllSellers,
} = require("../controllers/sellerController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/", getAllSellers);
router.get("/:sellerId", getSellerProfile);

// Protected routes
router.post("/", authMiddleware, becomeSeller);
router.put("/profile", authMiddleware, updateSellerProfile);

module.exports = router;