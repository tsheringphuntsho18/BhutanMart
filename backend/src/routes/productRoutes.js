const express = require("express");

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getRecentlyViewed,
  getProductUniqueViews,
} = require("../controllers/productController");

const authMiddleware = require("../middleware/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Specific routes before /:productId wildcard
router.get("/recently-viewed", authMiddleware, getRecentlyViewed);

// Public routes
router.get("/", getAllProducts);
router.get("/:productId", optionalAuth, getProductById);
router.get("/:productId/views", getProductUniqueViews);

// Protected routes (seller/admin)
router.post("/", authMiddleware, createProduct);
router.put("/:productId", authMiddleware, updateProduct);
router.delete("/:productId", authMiddleware, deleteProduct);

module.exports = router;
