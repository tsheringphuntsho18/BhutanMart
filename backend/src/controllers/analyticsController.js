const Order = require("../models/Order");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const Review = require("../models/Review");
const { redisClient } = require("../config/redis");

// Monthly revenue
const getMonthlyRevenue = async (req, res) => {
  try {
    const { month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const revenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ["Delivered", "Confirmed"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    res.json({
      month,
      year,
      data: revenue[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
    });
  } catch (error) {
    console.error("Get monthly revenue error:", error);
    res.status(500).json({ error: "Failed to fetch revenue data" });
  }
};

// Top products
const getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
    ]);

    res.json({ topProducts });
  } catch (error) {
    console.error("Get top products error:", error);
    res.status(500).json({ error: "Failed to fetch top products" });
  }
};

// Low stock alert
const getLowStockProducts = async (req, res) => {
  try {
    const lowStockProducts = await Inventory.aggregate([
      {
        $match: {
          $expr: { $lt: ["$stock", "$lowStockThreshold"] },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $sort: { stock: 1 } },
    ]);

    res.json({ lowStockProducts });
  } catch (error) {
    console.error("Get low stock error:", error);
    res.status(500).json({ error: "Failed to fetch low stock products" });
  }
};

// Trending products (from Redis)
const getTrendingProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const trendingIds = await redisClient.zRevRange("trending:products", 0, limit - 1);

    if (trendingIds.length === 0) {
      return res.json({ trendingProducts: [] });
    }

    const trendingProducts = await Product.find({
      _id: { $in: trendingIds },
    }).populate("categoryId", "name").populate("sellerId", "storeName");

    res.json({ trendingProducts });
  } catch (error) {
    console.error("Get trending products error:", error);
    res.status(500).json({ error: "Failed to fetch trending products" });
  }
};

// Product ratings and reviews
const getProductAnalytics = async (req, res) => {
  try {
    const productAnalytics = await Review.aggregate([
      {
        $group: {
          _id: "$productId",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $sort: { avgRating: -1 } },
    ]);

    res.json({ productAnalytics });
  } catch (error) {
    console.error("Get product analytics error:", error);
    res.status(500).json({ error: "Failed to fetch product analytics" });
  }
};

// User activity report
const getUserActivityReport = async (req, res) => {
  try {
    const userActivity = await Order.aggregate([
      {
        $group: {
          _id: "$userId",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $sort: { totalSpent: -1 } },
    ]);

    res.json({ userActivity });
  } catch (error) {
    console.error("Get user activity error:", error);
    res.status(500).json({ error: "Failed to fetch user activity" });
  }
};

module.exports = {
  getMonthlyRevenue,
  getTopProducts,
  getLowStockProducts,
  getTrendingProducts,
  getProductAnalytics,
  getUserActivityReport,
};
