const Review = require("../models/Review");
const { getPaginationParams, buildPaginationResponse } = require("../utils/pagination");

// Create review
const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user._id;

    if (!productId || !rating) {
      return res.status(400).json({ error: "Product ID and rating required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const review = new Review({
      productId,
      userId,
      rating,
      comment,
    });

    await review.save();
    await review.populate("userId", "name");

    res.status(201).json({
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
};

// Get reviews for product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page, limit } = req.query;
    const { skip } = getPaginationParams(page, limit);

    const reviews = await Review.find({ productId })
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Review.countDocuments({ productId });

    const response = buildPaginationResponse(reviews, totalCount, page, limit);

    res.json(response);
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

// Update review
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check authorization
    if (review.userId.toString() !== req.user._id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    await review.save();
    await review.populate("userId", "name");

    res.json({
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
};

// Delete review
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check authorization
    if (review.userId.toString() !== req.user._id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
};
