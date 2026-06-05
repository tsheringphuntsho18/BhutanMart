const express = require("express");

const {
  getMonthlyRevenue,
  getTopProducts,
  getLowStockProducts,
  getTrendingProducts,
  getProductAnalytics,
  getUserActivityReport,
  getDailySalesReport,
  getMostViewedVsPurchased,
  getTopBuyers,
  getTopSellers,
} = require("../controllers/analyticsController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Protected routes (admin only)
router.get("/revenue", authMiddleware, getMonthlyRevenue);
router.get("/revenue/daily", authMiddleware, getDailySalesReport);
router.get("/top-products", authMiddleware, getTopProducts);
router.get("/low-stock", authMiddleware, getLowStockProducts);
router.get("/trending", getTrendingProducts);
router.get("/product-analytics", authMiddleware, getProductAnalytics);
router.get("/user-activity", authMiddleware, getUserActivityReport);
router.get("/viewed-vs-purchased", authMiddleware, getMostViewedVsPurchased);
router.get("/leaderboard/buyers", authMiddleware, getTopBuyers);
router.get("/leaderboard/sellers", getTopSellers); // public — leaderboard is visible to everyone

module.exports = router;
