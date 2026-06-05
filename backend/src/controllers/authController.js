const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const { redisClient } = require("../config/redis");

// Register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "customer",
    });

    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user._id, user.role);

    // Store session in Redis (best-effort — skip if Redis is unavailable)
    try {
      await redisClient.setEx(
        `session:${user._id}`,
        86400 * 7,
        JSON.stringify({
          userId: user._id,
          email: user.email,
          role: user.role,
          loginTime: new Date(),
        })
      );
    } catch (redisErr) {
      console.warn("Redis session store skipped:", redisErr.message);
    }

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

// Logout user
const logoutUser = async (req, res) => {
  try {
    const userId = req.user._id;
    try {
      await redisClient.del(`session:${userId}`);
    } catch (redisErr) {
      console.warn("Redis session delete skipped:", redisErr.message);
    }
    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
};
