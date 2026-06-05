const express = require("express");

const {
  becomeSeller,
  getSellerProfile,
  updateSellerProfile,
  getAllSellers,
  getMyProducts,
  getSellerOrders,
  updateSellerOrderStatus,
} = require("../controllers/sellerController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Specific /my routes MUST come before /:sellerId wildcard
router.get("/my/products", authMiddleware, getMyProducts);
router.get("/my/orders", authMiddleware, getSellerOrders);
router.put("/my/orders/:orderId/status", authMiddleware, updateSellerOrderStatus);
router.put("/profile", authMiddleware, updateSellerProfile);
router.post("/", authMiddleware, becomeSeller);

// Wildcard routes last
router.get("/", getAllSellers);
router.get("/:sellerId", getSellerProfile);

module.exports = router;
