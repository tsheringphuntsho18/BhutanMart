const express = require("express");

const {
  getMonthlyRevenue,
  getTopProducts,
  getLowStockProducts,
  getTrendingProducts,
  getProductAnalytics,
  getUserActivityReport,
} = require("../controllers/analyticsController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Protected routes (admin only)
router.get("/revenue", authMiddleware, getMonthlyRevenue);
router.get("/top-products", authMiddleware, getTopProducts);
router.get("/low-stock", authMiddleware, getLowStockProducts);
router.get("/trending", getTrendingProducts);
router.get("/product-analytics", authMiddleware, getProductAnalytics);
router.get("/user-activity", authMiddleware, getUserActivityReport);

module.exports = router;
