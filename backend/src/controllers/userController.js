const User = require("../models/User");

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
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
    const { name, email, paymentPreference, avatar } = req.body;

    const updateFields = { name, email, paymentPreference };
    if (avatar !== undefined) updateFields.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
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
      req.user._id,
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

// Remove address
const removeAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "Address removed", addresses: user.addresses });
  } catch (error) {
    console.error("Remove address error:", error);
    res.status(500).json({ error: "Failed to remove address" });
  }
};

// Add to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
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
      req.user._id,
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
  removeAddress,
  addToWishlist,
  removeFromWishlist,
};
