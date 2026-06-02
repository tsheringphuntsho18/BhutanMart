const Order = require("../models/Order");
const Inventory = require("../models/Inventory");
const { redisClient } = require("../config/redis");
const mongoose = require("mongoose");

// Place order (with transaction)
const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, paymentMethod } = req.body;
    const userId = req.user.userId;

    if (!items || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Order must have items" });
    }

    let totalAmount = 0;
    const orderItems = [];

    // Validate and process items
    for (const item of items) {
      const inventory = await Inventory.findOne({ productId: item.productId }).session(session);

      if (!inventory || inventory.stock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({ error: `Insufficient stock for product ${item.productId}` });
      }

      // Decrement stock (atomic)
      await Inventory.findByIdAndUpdate(
        inventory._id,
        { $inc: { stock: -item.quantity } },
        { session, new: true }
      );

      orderItems.push({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      });

      totalAmount += item.price * item.quantity;
    }

    // Create order
    const order = new Order({
      userId,
      items: orderItems,
      totalAmount,
      paymentMethod: paymentMethod || "COD",
    });

    await order.save({ session });

    // Clear user's cart
    const cartKey = `cart:${userId}`;
    await redisClient.del(cartKey);

    // Update trending products
    for (const item of items) {
      await redisClient.zIncrBy("trending:products", 1, item.productId);
      await redisClient.expire("trending:products", 3600);
    }

    await session.commitTransaction();

    res.status(201).json({
      message: "Order placed successfully",
      orderId: order._id,
      totalAmount,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Place order error:", error);
    res.status(500).json({ error: "Failed to place order" });
  } finally {
    await session.endSession();
  }
};

// Get orders for user
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId })
      .populate("items.productId", "name imageUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Order.countDocuments({ userId });

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate("items.productId", "name imageUrl price");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check authorization
    if (order.userId.toString() !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

// Update order status (admin/seller)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["Placed", "Confirmed", "Shipped", "Delivered", "Cancelled", "Returned"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).populate("items.productId", "name");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      message: "Order status updated",
      order,
    });
  } catch (error) {
    console.error("Update order error:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status === "Delivered" || order.status === "Cancelled") {
      await session.abortTransaction();
      return res.status(400).json({ error: "Cannot cancel this order" });
    }

    // Restore inventory
    for (const item of order.items) {
      await Inventory.findOneAndUpdate(
        { productId: item.productId },
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    order.status = "Cancelled";
    await order.save({ session });

    await session.commitTransaction();

    res.json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Cancel order error:", error);
    res.status(500).json({ error: "Failed to cancel order" });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  placeOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
};
