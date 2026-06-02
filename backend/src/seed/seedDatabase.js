const seedUsers = require("./seedUsers");
const seedCategories = require("./seedCategories");
const seedSellers = require("./seedSellers");
const seedProducts = require("./seedProducts");
const seedOrders = require("./seedOrders");

const seedDatabase = async () => {
  console.log("\n========== DATABASE SEEDING START ==========\n");

  try {
    // Seed in order of dependencies
    await seedUsers();
    await seedCategories();
    await seedSellers();
    await seedProducts();
    await seedOrders();

    console.log("\n========== DATABASE SEEDING COMPLETE ==========\n");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

module.exports = seedDatabase;
