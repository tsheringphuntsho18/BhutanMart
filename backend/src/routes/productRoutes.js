const express = require("express");

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/", getAllProducts);
router.get("/:productId", getProductById);

// Protected routes (seller/admin)
router.post("/", authMiddleware, createProduct);
router.put("/:productId", authMiddleware, updateProduct);
router.delete("/:productId", authMiddleware, deleteProduct);

module.exports = router;
