const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { redisClient } = require("../config/redis");

// Get all users (admin)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;

    const skip = (page - 1) * limit;

    const filter = role ? { role } : {};

    const users = await User.find(filter)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await User.countDocuments(filter);

    res.json({
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        ordersByStatus: ordersByStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

// Delete user (admin)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Update user role (admin)
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ["customer", "seller"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role. Can only assign customer or seller." });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
};

// Get all orders (admin)
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = status ? { status } : {};

    const orders = await Order.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// Redis observability — returns parsed INFO stats
const getRedisInfo = async (req, res) => {
  try {
    const info = await redisClient.info();

    // Parse key-value pairs from INFO output
    const parsed = {};
    info.split("\r\n").forEach((line) => {
      if (line && !line.startsWith("#")) {
        const [key, value] = line.split(":");
        if (key && value !== undefined) parsed[key.trim()] = value.trim();
      }
    });

    const summary = {
      redis_version: parsed.redis_version,
      uptime_in_seconds: parsed.uptime_in_seconds,
      connected_clients: parsed.connected_clients,
      used_memory_human: parsed.used_memory_human,
      used_memory_peak_human: parsed.used_memory_peak_human,
      total_commands_processed: parsed.total_commands_processed,
      keyspace_hits: parsed.keyspace_hits,
      keyspace_misses: parsed.keyspace_misses,
      hit_rate: parsed.keyspace_hits && parsed.keyspace_misses
        ? (
            (parseInt(parsed.keyspace_hits) /
              (parseInt(parsed.keyspace_hits) + parseInt(parsed.keyspace_misses))) *
            100
          ).toFixed(2) + "%"
        : "N/A",
      rdb_last_save_time: parsed.rdb_last_save_time,
      aof_enabled: parsed.aof_enabled,
      role: parsed.role,
    };

    res.json({ redisInfo: summary });
  } catch (error) {
    console.error("Redis info error:", error);
    res.status(500).json({ error: "Failed to fetch Redis info" });
  }
};

// MongoDB slow query profiling
const getMongoProfile = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const status = await db.command({ profile: -1 });
    res.json({
      profilingLevel: status.was,
      slowMs: status.slowms,
      note: "Level 0 = off, Level 1 = slow queries only, Level 2 = all queries",
    });
  } catch {
    // Atlas M0/M2/M5 free tiers do not support the profiling command
    res.json({
      profilingLevel: "N/A",
      slowMs: "N/A",
      note: "Profiling is not supported on MongoDB Atlas free tier (M0). Available on M10+. Slow query logs can be viewed in the Atlas UI under Performance Advisor.",
      atlasOnly: true,
    });
  }
};

const setMongoProfile = async (req, res) => {
  try {
    const { level = 1, slowMs = 100 } = req.body;
    const db = mongoose.connection.db;
    await db.command({ profile: level, slowms: slowMs });
    res.json({
      message: `Profiling set to level ${level}, slowMs: ${slowMs}`,
      profilingLevel: level,
      slowMs,
    });
  } catch {
    res.json({
      message: "Profiling not supported on Atlas free tier",
      atlasOnly: true,
    });
  }
};

module.exports = {
  getAllUsers,
  getDashboardStats,
  deleteUser,
  updateUserRole,
  getAllOrders,
  getRedisInfo,
  getMongoProfile,
  setMongoProfile,
};
