const Seller = require("../models/Seller");
const User = require("../models/User");

const seedSellers = async () => {
  try {
    // Check if sellers already exist
    const existingSellers = await Seller.countDocuments();
    if (existingSellers > 0) {
      console.log("Sellers already exist. Skipping...");
      return;
    }

    // Get seller users
    const seller1User = await User.findOne({ email: "seller1@bhutanmart.com" });
    const seller2User = await User.findOne({ email: "seller2@bhutanmart.com" });

    if (!seller1User || !seller2User) {
      console.log("Seller users not found. Please seed users first.");
      return;
    }

    const sellers = [
      {
        owner: seller1User._id,
        storeName: "TechHub",
        description: "Your one-stop shop for electronics and gadgets",
        rating: 4.5,
      },
      {
        owner: seller2User._id,
        storeName: "Fashion Corner",
        description: "Latest fashion trends and quality clothing",
        rating: 4.2,
      },
    ];

    const result = await Seller.insertMany(sellers);
    console.log(`✓ Seeded ${result.length} sellers`);
    return result;
  } catch (error) {
    console.error("Error seeding sellers:", error.message);
    throw error;
  }
};

module.exports = seedSellers;
