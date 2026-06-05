const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");

const randomStatus = () => {
  const statuses = ["Placed", "Confirmed", "Shipped", "Delivered", "Delivered", "Delivered"];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const randomDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d;
};

const seedOrders = async () => {
  try {
    const existingOrders = await Order.countDocuments();
    if (existingOrders > 0) {
      console.log("Orders already exist. Skipping...");
      return;
    }

    const customers = await User.find({ role: "customer" });
    const products = await Product.find().limit(20);

    if (customers.length === 0 || products.length === 0) {
      console.log("Customers or products not found. Please seed them first.");
      return;
    }

    const pick = (arr, n = 1) => {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, n);
    };

    const orders = [];

    // Generate 20 orders spread across customers and products
    for (let i = 0; i < 20; i++) {
      const customer = customers[i % customers.length];
      const orderProducts = pick(products, Math.floor(Math.random() * 3) + 1);

      const items = orderProducts.map((p) => ({
        productId: p._id,
        name: p.name,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: p.price,
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      orders.push({
        userId: customer._id,
        items,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        status: randomStatus(),
        paymentMethod: i % 3 === 0 ? "Card" : "COD",
        createdAt: randomDate(60),
      });
    }

    const result = await Order.insertMany(orders);
    console.log(`✓ Seeded ${result.length} orders`);
    return result;
  } catch (error) {
    console.error("Error seeding orders:", error.message);
    throw error;
  }
};

module.exports = seedOrders;
