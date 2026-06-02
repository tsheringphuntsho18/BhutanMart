const Category = require("../models/Category");

const seedCategories = async () => {
  try {
    // Check if categories already exist
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      console.log("Categories already exist. Skipping...");
      return;
    }

    const categories = [
      {
        name: "Electronics",
        description: "Electronic devices and gadgets",
      },
      {
        name: "Clothing",
        description: "Men, women, and kids clothing",
      },
      {
        name: "Home & Garden",
        description: "Home decor and garden items",
      },
      {
        name: "Books",
        description: "Physical and digital books",
      },
      {
        name: "Sports & Outdoors",
        description: "Sports equipment and outdoor gear",
      },
    ];

    const result = await Category.insertMany(categories);
    console.log(`✓ Seeded ${result.length} categories`);
    return result;
  } catch (error) {
    console.error("Error seeding categories:", error.message);
    throw error;
  }
};

module.exports = seedCategories;
