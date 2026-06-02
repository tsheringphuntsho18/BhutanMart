const User = require("../models/User");
const bcrypt = require("bcryptjs");

const seedUsers = async () => {
  try {
    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log("Users already exist. Skipping...");
      return;
    }

    const users = [
      {
        name: "Admin User",
        email: "admin@bhutanmart.com",
        password: await bcrypt.hash("admin123", 10),
        role: "admin",
      },
      {
        name: "John Doe",
        email: "john@bhutanmart.com",
        password: await bcrypt.hash("customer123", 10),
        role: "customer",
      },
      {
        name: "Jane Smith",
        email: "jane@bhutanmart.com",
        password: await bcrypt.hash("customer123", 10),
        role: "customer",
      },
      {
        name: "Seller One",
        email: "seller1@bhutanmart.com",
        password: await bcrypt.hash("seller123", 10),
        role: "seller",
      },
      {
        name: "Seller Two",
        email: "seller2@bhutanmart.com",
        password: await bcrypt.hash("seller123", 10),
        role: "seller",
      },
    ];

    const result = await User.insertMany(users);
    console.log(`✓ Seeded ${result.length} users`);
    return result;
  } catch (error) {
    console.error("Error seeding users:", error.message);
    throw error;
  }
};

module.exports = seedUsers;
