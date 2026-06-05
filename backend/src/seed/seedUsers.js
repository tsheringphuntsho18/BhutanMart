const User = require("../models/User");
const bcrypt = require("bcryptjs");

const seedUsers = async () => {
  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log("Users already exist. Skipping...");
      return;
    }

    const hash = (pw) => bcrypt.hash(pw, 10);

    const users = [
      { name: "Admin User",       email: "admin@bhutanmart.com",    password: await hash("admin123"),    role: "admin" },
      { name: "John Doe",         email: "john@bhutanmart.com",     password: await hash("customer123"), role: "customer" },
      { name: "Jane Smith",       email: "jane@bhutanmart.com",     password: await hash("customer123"), role: "customer" },
      { name: "Karma Wangchuk",   email: "karma@bhutanmart.com",    password: await hash("customer123"), role: "customer" },
      { name: "Pema Dorji",       email: "pema@bhutanmart.com",     password: await hash("customer123"), role: "customer" },
      { name: "Tashi Namgyal",    email: "tashi@bhutanmart.com",    password: await hash("customer123"), role: "customer" },
      { name: "Sonam Choden",     email: "sonam@bhutanmart.com",    password: await hash("customer123"), role: "customer" },
      { name: "Deki Lhamo",       email: "deki@bhutanmart.com",     password: await hash("customer123"), role: "customer" },
      { name: "Seller One",       email: "seller1@bhutanmart.com",  password: await hash("seller123"),   role: "seller" },
      { name: "Seller Two",       email: "seller2@bhutanmart.com",  password: await hash("seller123"),   role: "seller" },
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
