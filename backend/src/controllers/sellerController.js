const Seller = require("../models/Seller");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Inventory = require("../models/Inventory");
const { redisClient } = require("../config/redis");

// Become a seller
const becomeSeller = async (req, res) => {
  try {
    const { storeName, description } = req.body;
    const userId = req.user._id;

    if (!storeName) {
      return res.status(400).json({ error: "Store name required" });
    }

    // Check if already a seller
    let seller = await Seller.findOne({ owner: userId });
    if (seller) {
      return res.status(400).json({ error: "User is already a seller" });
    }

    // Create seller profile
    seller = new Seller({
      owner: userId,
      storeName,
      description,
    });

    await seller.save();
    await seller.populate("owner", "name email");

    // Update user role
    await User.findByIdAndUpdate(userId, { role: "seller" });

    res.status(201).json({
      message: "Seller profile created successfully",
      seller,
    });
  } catch (error) {
    console.error("Become seller error:", error);
    res.status(500).json({ error: "Failed to create seller profile" });
  }
};

// Get seller profile
const getSellerProfile = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await Seller.findById(sellerId)
      .populate("owner", "name email");

    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    // Get seller rating from Redis leaderboard
    const rating = await redisClient.zScore("leaderboard:sellers", sellerId);

    res.json({
      ...seller.toObject(),
      leaderboardRating: rating || 0,
    });
  } catch (error) {
    console.error("Get seller error:", error);
    res.status(500).json({ error: "Failed to fetch seller" });
  }
};

// Update seller profile
const updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { storeName, description } = req.body;

    const seller = await Seller.findOneAndUpdate(
      { owner: sellerId },
      { storeName, description },
      { new: true }
    ).populate("owner", "name email");

    if (!seller) {
      return res.status(404).json({ error: "Seller profile not found" });
    }

    res.json({
      message: "Seller profile updated successfully",
      seller,
    });
  } catch (error) {
    console.error("Update seller error:", error);
    res.status(500).json({ error: "Failed to update seller profile" });
  }
};

// Get all sellers (with pagination)
const getAllSellers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const sellers = await Seller.find()
      .populate("owner", "name email")
      .skip(skip)
      .limit(limit);

    const totalCount = await Seller.countDocuments();

    // Add leaderboard ratings
    const sellersWithRatings = await Promise.all(
      sellers.map(async (seller) => {
        const rating = await redisClient.zScore("leaderboard:sellers", seller._id.toString());
        return {
          ...seller.toObject(),
          leaderboardRating: rating || 0,
        };
      })
    );

    res.json({
      data: sellersWithRatings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    });
  } catch (error) {
    console.error("Get sellers error:", error);
    res.status(500).json({ error: "Failed to fetch sellers" });
  }
};

// Get logged-in seller's own products
const getMyProducts = async (req, res) => {
  try {
    const seller = await Seller.findOne({ owner: req.user._id });
    if (!seller) return res.json({ products: [], pagination: { currentPage: 1, totalPages: 0, totalCount: 0 }, noProfile: true });

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Match either Seller doc _id (new) or User _id (legacy products)
    const sellerFilter = { $or: [{ sellerId: seller._id }, { sellerId: req.user._id }] };

    const products = await Product.find(sellerFilter)
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Product.countDocuments(sellerFilter);

    // Attach stock from Inventory
    const enriched = await Promise.all(products.map(async (p) => {
      const inv = await Inventory.findOne({ productId: p._id }).lean();
      return { ...p.toObject(), inventoryStock: inv?.stock ?? p.stock };
    }));

    res.json({
      products: enriched,
      pagination: { currentPage: parseInt(page), totalPages: Math.ceil(totalCount / limit), totalCount },
    });
  } catch (error) {
    console.error("Get my products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// Get orders that contain this seller's products
const getSellerOrders = async (req, res) => {
  try {
    const seller = await Seller.findOne({ owner: req.user._id });
    if (!seller) return res.json({ orders: [], pagination: { currentPage: 1, totalPages: 0, totalCount: 0 }, noProfile: true });

    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    // Match either Seller doc _id (new) or User _id (legacy products)
    const sellerProducts = await Product.find({
      $or: [{ sellerId: seller._id }, { sellerId: req.user._id }],
    }).select("_id");
    const productIds = sellerProducts.map((p) => p._id);

    const filter = { "items.productId": { $in: productIds } };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate("userId", "name email avatar")
      .populate("items.productId", "name imageUrl price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: { currentPage: parseInt(page), totalPages: Math.ceil(totalCount / limit), totalCount },
    });
  } catch (error) {
    console.error("Get seller orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// Update order status (seller — only orders containing their products)
const updateSellerOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["Confirmed", "Shipped", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status for seller" });
    }

    const seller = await Seller.findOne({ owner: req.user._id });
    if (!seller) return res.status(403).json({ error: "Complete your seller profile first" });

    // Verify this order contains at least one of this seller's products
    const sellerProducts = await Product.find({
      $or: [{ sellerId: seller._id }, { sellerId: req.user._id }],
    }).select("_id");
    const productIds = sellerProducts.map((p) => p._id.toString());

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Terminal states — cannot be modified
    if (order.status === "Delivered" || order.status === "Cancelled") {
      return res.status(400).json({ error: `Order is already ${order.status} and cannot be changed` });
    }

    const hasSellerItem = order.items.some((item) =>
      productIds.includes(item.productId.toString())
    );

    if (!hasSellerItem) {
      return res.status(403).json({ error: "This order does not contain your products" });
    }

    order.status = status;
    await order.save();

    res.json({ message: "Order status updated", order });
  } catch (error) {
    console.error("Update seller order status error:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

module.exports = {
  becomeSeller,
  getSellerProfile,
  updateSellerProfile,
  getAllSellers,
  getMyProducts,
  getSellerOrders,
  updateSellerOrderStatus,
};
