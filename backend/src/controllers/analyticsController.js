const Order = require("../models/Order");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const Review = require("../models/Review");
const { redisClient } = require("../config/redis");

// Monthly revenue
const getMonthlyRevenue = async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);
    const year  = parseInt(req.query.year,  10) || now.getFullYear();

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

    const trendingIds = await redisClient.zRange("trending:products", 0, parseInt(limit) - 1, { REV: true });

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

// Daily sales report
const getDailySalesReport = async (req, res) => {
  try {
    const now = new Date();
    const m = parseInt(req.query.month, 10) || (now.getMonth() + 1);
    const y = parseInt(req.query.year,  10) || now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const daily = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ["Delivered", "Confirmed", "Placed"] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          dailyRevenue: { $sum: "$totalAmount" },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ month, year, dailyReport: daily });
  } catch (error) {
    console.error("Daily sales error:", error);
    res.status(500).json({ error: "Failed to fetch daily sales" });
  }
};

// Most viewed vs most purchased product analysis
const getMostViewedVsPurchased = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Most purchased from MongoDB
    const mostPurchased = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalPurchased: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalPurchased: -1 } },
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
      { $project: { "product.name": 1, "product._id": 1, totalPurchased: 1 } },
    ]);

    // Most viewed: fetch page_view counts from Redis HyperLogLog for each product
    const productIds = mostPurchased.map((p) => p._id.toString());
    const viewCounts = await Promise.all(
      productIds.map(async (id) => ({
        productId: id,
        uniqueViews: await redisClient.pfCount(`page_views:${id}`),
      }))
    );

    const viewMap = Object.fromEntries(
      viewCounts.map((v) => [v.productId, v.uniqueViews])
    );

    const combined = mostPurchased.map((p) => ({
      productId: p._id,
      name: p.product.name,
      totalPurchased: p.totalPurchased,
      uniqueViews: viewMap[p._id.toString()] || 0,
    }));

    res.json({ analysis: combined });
  } catch (error) {
    console.error("Most viewed vs purchased error:", error);
    res.status(500).json({ error: "Failed to fetch analysis" });
  }
};

// Top buyers leaderboard (current month from Redis)
const getTopBuyers = async (req, res) => {
  try {
    const { month, year, limit = 10 } = req.query;
    const now = new Date();
    const m = month || String(now.getMonth() + 1).padStart(2, "0");
    const y = year || now.getFullYear();
    const key = `leaderboard:buyers:${y}-${String(m).padStart(2, "0")}`;

    const buyers = await redisClient.zRangeWithScores(key, 0, parseInt(limit) - 1, { REV: true });

    if (!buyers.length) return res.json({ topBuyers: [] });

    const User = require("../models/User");
    const enriched = await Promise.all(
      buyers.map(async ({ value: userId, score }) => {
        const user = await User.findById(userId).select("name email").lean();
        return { userId, name: user?.name, email: user?.email, totalSpent: score };
      })
    );

    res.json({ month: m, year: y, topBuyers: enriched });
  } catch (error) {
    console.error("Top buyers error:", error);
    res.status(500).json({ error: "Failed to fetch top buyers" });
  }
};

// Top sellers leaderboard (from Redis Sorted Set)
const getTopSellers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const sellers = await redisClient.zRangeWithScores("leaderboard:sellers", 0, parseInt(limit) - 1, { REV: true });

    if (!sellers.length) return res.json({ topSellers: [] });

    const Seller = require("../models/Seller");
    const enriched = await Promise.all(
      sellers.map(async ({ value: sellerId, score }) => {
        const seller = await Seller.findById(sellerId).select("storeName").lean();
        return { sellerId, storeName: seller?.storeName, score };
      })
    );

    res.json({ topSellers: enriched });
  } catch (error) {
    console.error("Top sellers error:", error);
    res.status(500).json({ error: "Failed to fetch top sellers" });
  }
};

module.exports = {
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
};
