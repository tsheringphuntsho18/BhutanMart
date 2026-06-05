const express = require("express");

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getGuestCart,
  addToGuestCart,
  updateGuestCartItem,
  removeFromGuestCart,
  clearGuestCart,
} = require("../controllers/cartController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Authenticated user cart
router.get("/", authMiddleware, getCart);
router.post("/add", authMiddleware, addToCart);
router.put("/update", authMiddleware, updateCartItem);
router.delete("/remove/:productId", authMiddleware, removeFromCart);
router.delete("/clear", authMiddleware, clearCart);

// Guest cart (no auth required — guestId is a UUID generated client-side)
router.get("/guest/:guestId", getGuestCart);
router.post("/guest/:guestId/add", addToGuestCart);
router.put("/guest/:guestId/update", updateGuestCartItem);
router.delete("/guest/:guestId/remove/:productId", removeFromGuestCart);
router.delete("/guest/:guestId/clear", clearGuestCart);

module.exports = router;
