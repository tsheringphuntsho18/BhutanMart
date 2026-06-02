const Seller = require("../models/Seller");
const User = require("../models/User");
const { redisClient } = require("../config/redis");

// Become a seller
const becomeSeller = async (req, res) => {
  try {
    const { storeName, description } = req.body;
    const userId = req.user.userId;

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
    const sellerId = req.user.userId;
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

module.exports = {
  becomeSeller,
  getSellerProfile,
  updateSellerProfile,
  getAllSellers,
};
