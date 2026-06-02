const Product = require("../models/Product");
const Inventory = require("../models/Inventory");

const seedProducts = async () => {
  try {
    // Check if products already exist
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log("Products already exist. Skipping...");
      return;
    }

    // Get category and seller IDs
    const Category = require("../models/Category");
    const Seller = require("../models/Seller");

    const electronics = await Category.findOne({ name: "Electronics" });
    const clothing = await Category.findOne({ name: "Clothing" });
    const homeGarden = await Category.findOne({ name: "Home & Garden" });

    const seller1 = await Seller.findOne({ storeName: "TechHub" });
    const seller2 = await Seller.findOne({ storeName: "Fashion Corner" });

    if (!electronics || !clothing || !homeGarden || !seller1 || !seller2) {
      console.log("Categories or Sellers not found. Please seed them first.");
      return;
    }

    const products = [
      {
        name: "Wireless Headphones",
        description: "Premium wireless headphones with noise cancellation",
        categoryId: electronics._id,
        sellerId: seller1._id,
        price: 99.99,
        stock: 50,
        tags: ["electronics", "audio", "wireless"],
        variants: [
          { color: "Black", sku: "WH-001-BLK" },
          { color: "White", sku: "WH-001-WHT" },
        ],
      },
      {
        name: "Cotton T-Shirt",
        description: "High quality 100% cotton t-shirt",
        categoryId: clothing._id,
        sellerId: seller2._id,
        price: 19.99,
        stock: 100,
        tags: ["clothing", "casual"],
        variants: [
          { size: "S", color: "Blue", sku: "TS-001-S-BLU" },
          { size: "M", color: "Blue", sku: "TS-001-M-BLU" },
          { size: "L", color: "Red", sku: "TS-001-L-RED" },
        ],
      },
      {
        name: "Laptop Stand",
        description: "Adjustable aluminum laptop stand",
        categoryId: electronics._id,
        sellerId: seller1._id,
        price: 39.99,
        stock: 30,
        tags: ["electronics", "laptop", "stand"],
      },
      {
        name: "Wall Clock",
        description: "Modern minimalist wall clock",
        categoryId: homeGarden._id,
        sellerId: seller2._id,
        price: 24.99,
        stock: 45,
        tags: ["home", "decor", "clock"],
      },
      {
        name: "USB-C Cable",
        description: "High-speed USB-C charging cable",
        categoryId: electronics._id,
        sellerId: seller1._id,
        price: 9.99,
        stock: 200,
        tags: ["electronics", "cable", "usb"],
      },
    ];

    const result = await Product.insertMany(products);
    console.log(`✓ Seeded ${result.length} products`);

    // Seed inventory for each product
    const inventoryItems = result.map((product) => ({
      productId: product._id,
      stock: product.stock,
      lowStockThreshold: 10,
    }));

    const inventoryResult = await Inventory.insertMany(inventoryItems);
    console.log(`✓ Seeded ${inventoryResult.length} inventory records`);

    return result;
  } catch (error) {
    console.error("Error seeding products:", error.message);
    throw error;
  }
};

module.exports = seedProducts;
