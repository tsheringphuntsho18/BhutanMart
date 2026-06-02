const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");

const seedOrders = async () => {
  try {
    // Check if orders already exist
    const existingOrders = await Order.countDocuments();
    if (existingOrders > 0) {
      console.log("Orders already exist. Skipping...");
      return;
    }

    // Get customer users and products
    const customer1 = await User.findOne({ email: "john@bhutanmart.com" });
    const customer2 = await User.findOne({ email: "jane@bhutanmart.com" });
    const products = await Product.find().limit(5);

    if (!customer1 || !customer2 || products.length === 0) {
      console.log("Customers or products not found. Please seed them first.");
      return;
    }

    const orders = [
      {
        userId: customer1._id,
        items: [
          {
            productId: products[0]._id,
            name: products[0].name,
            quantity: 1,
            price: products[0].price,
          },
          {
            productId: products[2]._id,
            name: products[2].name,
            quantity: 2,
            price: products[2].price,
          },
        ],
        totalAmount: products[0].price + 2 * products[2].price,
        status: "Delivered",
        paymentMethod: "COD",
      },
      {
        userId: customer2._id,
        items: [
          {
            productId: products[1]._id,
            name: products[1].name,
            quantity: 3,
            price: products[1].price,
          },
        ],
        totalAmount: 3 * products[1].price,
        status: "Confirmed",
        paymentMethod: "COD",
      },
      {
        userId: customer1._id,
        items: [
          {
            productId: products[4]._id,
            name: products[4].name,
            quantity: 5,
            price: products[4].price,
          },
        ],
        totalAmount: 5 * products[4].price,
        status: "Placed",
        paymentMethod: "COD",
      },
    ];

    const result = await Order.insertMany(orders);
    console.log(`✓ Seeded ${result.length} orders`);
    return result;
  } catch (error) {
    console.error("Error seeding orders:", error.message);
    throw error;
  }
};

module.exports = seedOrders;
