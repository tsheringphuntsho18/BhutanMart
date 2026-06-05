const express = require("express");

const {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  updateUserRole,
  getAllOrders,
  getRedisInfo,
  getMongoProfile,
  setMongoProfile,
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All admin routes require authentication
router.use(authMiddleware);

router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.delete("/users/:userId", deleteUser);
router.put("/users/:userId/role", updateUserRole);
router.get("/orders", getAllOrders);
router.get("/redis-info", getRedisInfo);
router.get("/mongo-profile", getMongoProfile);
router.post("/mongo-profile", setMongoProfile);

module.exports = router;
