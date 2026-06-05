const express = require("express");

const {
  placeOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");
const createRateLimiter = require("../middleware/rateLimiter");

const router = express.Router();

// Protected routes
router.get("/", authMiddleware, getUserOrders);
router.get("/:orderId", authMiddleware, getOrderById);
router.post("/", authMiddleware, createRateLimiter("checkout", 10), placeOrder);
router.put("/:orderId/status", authMiddleware, updateOrderStatus);
router.put("/:orderId/cancel", authMiddleware, cancelOrder);

module.exports = router;