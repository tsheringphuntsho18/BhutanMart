const User = require("../models/User");

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password")
      .populate("wishlist");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { name, email, paymentPreference } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, email, paymentPreference },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Add address
const addAddress = async (req, res) => {
  try {
    const { label, street, city, state, country, postalCode } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $push: {
          addresses: { label, street, city, state, country, postalCode },
        },
      },
      { new: true }
    );

    res.json({
      message: "Address added successfully",
      user,
    });
  } catch (error) {
    console.error("Add address error:", error);
    res.status(500).json({ error: "Failed to add address" });
  }
};

// Add to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $addToSet: { wishlist: productId } },
      { new: true }
    ).populate("wishlist");

    res.json({
      message: "Added to wishlist",
      wishlist: user.wishlist,
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    res.status(500).json({ error: "Failed to add to wishlist" });
  }
};

// Remove from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $pull: { wishlist: productId } },
      { new: true }
    ).populate("wishlist");

    res.json({
      message: "Removed from wishlist",
      wishlist: user.wishlist,
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    res.status(500).json({ error: "Failed to remove from wishlist" });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  addAddress,
  addToWishlist,
  removeFromWishlist,
};
