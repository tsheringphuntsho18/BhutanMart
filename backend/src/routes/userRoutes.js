const express = require("express");

const {
  getUserProfile,
  updateUserProfile,
  addAddress,
  removeAddress,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Protected routes (requires authentication)
router.get("/profile", authMiddleware, getUserProfile);
router.put("/profile", authMiddleware, updateUserProfile);
router.post("/address", authMiddleware, addAddress);
router.delete("/address/:addressId", authMiddleware, removeAddress);
router.post("/wishlist", authMiddleware, addToWishlist);
router.delete("/wishlist/:productId", authMiddleware, removeFromWishlist);

module.exports = router;