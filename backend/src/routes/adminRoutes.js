const express = require("express");

const {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  updateUserRole,
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All admin routes require authentication
router.use(authMiddleware);

router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.delete("/users/:userId", deleteUser);
router.put("/users/:userId/role", updateUserRole);

module.exports = router;
