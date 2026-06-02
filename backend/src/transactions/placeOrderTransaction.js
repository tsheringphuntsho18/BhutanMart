const mongoose = require("mongoose");
const Order = require("../models/Order");
const Inventory = require("../models/Inventory");
const { redisClient } = require("../config/redis");

const placeOrderWithTransaction = async (userId, items, paymentMethod = "COD") => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate and process items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      // Find and lock inventory
      const inventory = await Inventory.findOne({
        productId: item.productId,
      }).session(session);

      if (!inventory) {
        throw new Error(`Product ${item.productId} not found in inventory`);
      }

      if (inventory.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for product ${item.productId}. Available: ${inventory.stock}, Requested: ${item.quantity}`
        );
      }

      // Decrement stock atomically
      const updatedInventory = await Inventory.findByIdAndUpdate(
        inventory._id,
        { $inc: { stock: -item.quantity } },
        { session, new: true }
      );

      if (updatedInventory.stock < 0) {
        throw new Error(`Race condition detected for product ${item.productId}`);
      }

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
      paymentMethod,
      status: "Placed",
    });

    await order.save({ session });

    // Commit transaction
    await session.commitTransaction();

    // Update Redis after successful transaction
    // Clear cart
    await redisClient.del(`cart:${userId}`);

    // Update trending products
    for (const item of items) {
      await redisClient.zIncrBy("trending:products", 1, item.productId);
    }

    // Set trending products expiration
    await redisClient.expire("trending:products", 3600);

    return {
      success: true,
      orderId: order._id,
      totalAmount,
      message: "Order placed successfully",
    };
  } catch (error) {
    await session.abortTransaction();
    throw {
      success: false,
      error: error.message,
      code: "ORDER_PLACEMENT_FAILED",
    };
  } finally {
    await session.endSession();
  }
};

module.exports = { placeOrderWithTransaction };
