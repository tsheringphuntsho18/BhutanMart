const Product = require("../models/Product");
const Inventory = require("../models/Inventory");

const seedProducts = async () => {
  try {
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log("Products already exist. Skipping...");
      return;
    }

    const Category = require("../models/Category");
    const Seller = require("../models/Seller");

    const electronics  = await Category.findOne({ name: "Electronics" });
    const clothing     = await Category.findOne({ name: "Clothing" });
    const homeGarden   = await Category.findOne({ name: "Home & Garden" });
    const books        = await Category.findOne({ name: "Books" });
    const sports       = await Category.findOne({ name: "Sports & Outdoors" });

    const seller1 = await Seller.findOne({ storeName: "TechHub" });
    const seller2 = await Seller.findOne({ storeName: "Fashion Corner" });

    if (!electronics || !clothing || !homeGarden || !seller1 || !seller2) {
      console.log("Missing categories or sellers. Please seed them first.");
      return;
    }

    const products = [
      // Electronics (20)
      { name: "Wireless Headphones",      description: "Premium noise-cancelling Bluetooth headphones",       categoryId: electronics._id, sellerId: seller1._id, price: 99.99,  stock: 50,  tags: ["audio","wireless"],    attributes: { connectivity: "Bluetooth 5.0", batteryLife: "30h" },   variants: [{ color: "Black", sku: "WH-001-BLK" }, { color: "White", sku: "WH-001-WHT" }] },
      { name: "Laptop Stand",             description: "Adjustable aluminium laptop stand",                   categoryId: electronics._id, sellerId: seller1._id, price: 39.99,  stock: 30,  tags: ["laptop","accessories"],  attributes: { material: "Aluminium", adjustable: true } },
      { name: "USB-C Cable 2m",           description: "High-speed USB-C charging and data cable",            categoryId: electronics._id, sellerId: seller1._id, price: 9.99,   stock: 200, tags: ["cable","usb"] },
      { name: "Mechanical Keyboard",      description: "RGB mechanical keyboard with Cherry MX switches",     categoryId: electronics._id, sellerId: seller1._id, price: 129.99, stock: 25,  tags: ["keyboard","gaming"],     attributes: { switchType: "Cherry MX Red", layout: "TKL" } },
      { name: "27-inch Monitor",          description: "QHD IPS monitor 144Hz refresh rate",                  categoryId: electronics._id, sellerId: seller1._id, price: 349.99, stock: 15,  tags: ["monitor","display"],     attributes: { resolution: "2560x1440", refreshRate: "144Hz", panelType: "IPS" } },
      { name: "Wireless Mouse",           description: "Ergonomic wireless mouse with long battery life",     categoryId: electronics._id, sellerId: seller1._id, price: 49.99,  stock: 60,  tags: ["mouse","wireless"] },
      { name: "Portable SSD 1TB",         description: "Fast portable SSD with USB 3.2 Gen 2 interface",     categoryId: electronics._id, sellerId: seller1._id, price: 89.99,  stock: 40,  tags: ["storage","ssd"],         attributes: { capacity: "1TB", interface: "USB 3.2 Gen 2" } },
      { name: "Webcam HD 1080p",          description: "Full HD webcam with built-in microphone",             categoryId: electronics._id, sellerId: seller1._id, price: 59.99,  stock: 35,  tags: ["webcam","streaming"] },
      { name: "Smart Speaker",            description: "Voice-controlled smart speaker",                      categoryId: electronics._id, sellerId: seller1._id, price: 79.99,  stock: 45,  tags: ["speaker","smart-home"] },
      { name: "USB Hub 7-Port",           description: "7-port USB 3.0 hub with power delivery",             categoryId: electronics._id, sellerId: seller1._id, price: 29.99,  stock: 80,  tags: ["usb","hub"] },
      { name: "Laptop Cooling Pad",       description: "Dual-fan cooling pad for 15-17 inch laptops",        categoryId: electronics._id, sellerId: seller1._id, price: 24.99,  stock: 55,  tags: ["laptop","cooling"] },
      { name: "Wireless Charger 15W",     description: "Fast wireless charger compatible with Qi devices",   categoryId: electronics._id, sellerId: seller1._id, price: 34.99,  stock: 70,  tags: ["charger","wireless"] },
      { name: "Bluetooth Speaker",        description: "Waterproof portable Bluetooth speaker IPX7",         categoryId: electronics._id, sellerId: seller1._id, price: 69.99,  stock: 38,  tags: ["speaker","bluetooth"],   attributes: { waterproof: "IPX7", batteryLife: "24h" } },
      { name: "Cable Management Box",     description: "Large cable management box for desk organisation",   categoryId: electronics._id, sellerId: seller1._id, price: 19.99,  stock: 90,  tags: ["organiser","cables"] },
      { name: "Monitor Arm",              description: "Single monitor arm with full motion articulation",   categoryId: electronics._id, sellerId: seller1._id, price: 44.99,  stock: 22,  tags: ["monitor","arm"] },
      { name: "Noise-Cancelling Earbuds", description: "True wireless earbuds with ANC",                     categoryId: electronics._id, sellerId: seller1._id, price: 149.99, stock: 32,  tags: ["earbuds","anc"],         attributes: { connectivity: "Bluetooth 5.2", batteryLife: "8h + 24h case" } },
      { name: "Desk Lamp LED",            description: "Dimmable LED desk lamp with USB charging port",      categoryId: electronics._id, sellerId: seller1._id, price: 32.99,  stock: 50,  tags: ["lamp","led"] },
      { name: "HDMI Cable 2m",            description: "4K@60Hz HDMI 2.0 cable",                             categoryId: electronics._id, sellerId: seller1._id, price: 12.99,  stock: 150, tags: ["hdmi","cable"] },
      { name: "Phone Stand",              description: "Adjustable aluminium phone and tablet stand",        categoryId: electronics._id, sellerId: seller1._id, price: 14.99,  stock: 100, tags: ["stand","phone"] },
      { name: "Surge Protector 6-Outlet", description: "6-outlet surge protector with 2 USB ports",         categoryId: electronics._id, sellerId: seller1._id, price: 22.99,  stock: 65,  tags: ["power","surge"] },

      // Clothing (15)
      { name: "Cotton T-Shirt",           description: "High-quality 100% cotton T-shirt",                   categoryId: clothing._id,    sellerId: seller2._id, price: 19.99,  stock: 100, tags: ["clothing","casual"],     variants: [{ size: "S", color: "Blue", sku: "TS-BLU-S" }, { size: "M", color: "Blue", sku: "TS-BLU-M" }, { size: "L", color: "Red", sku: "TS-RED-L" }] },
      { name: "Slim Fit Jeans",           description: "Comfortable slim-fit stretch jeans",                 categoryId: clothing._id,    sellerId: seller2._id, price: 49.99,  stock: 80,  tags: ["clothing","jeans"],      attributes: { fabric: "98% Cotton 2% Elastane" }, variants: [{ size: "32", color: "Navy", sku: "JN-NVY-32" }, { size: "34", color: "Black", sku: "JN-BLK-34" }] },
      { name: "Hooded Sweatshirt",        description: "Fleece-lined pullover hoodie",                       categoryId: clothing._id,    sellerId: seller2._id, price: 39.99,  stock: 60,  tags: ["clothing","hoodie"],     variants: [{ size: "S", color: "Grey", sku: "HD-GRY-S" }, { size: "M", color: "Black", sku: "HD-BLK-M" }] },
      { name: "Running Shorts",           description: "Lightweight moisture-wicking running shorts",        categoryId: clothing._id,    sellerId: seller2._id, price: 24.99,  stock: 70,  tags: ["clothing","sports"],     attributes: { fabric: "Polyester blend" } },
      { name: "Winter Jacket",            description: "Water-resistant insulated winter jacket",            categoryId: clothing._id,    sellerId: seller2._id, price: 89.99,  stock: 30,  tags: ["clothing","winter"],     attributes: { insulation: "600-fill down", waterResistance: "DWR coated" } },
      { name: "Polo Shirt",               description: "Classic pique polo shirt",                           categoryId: clothing._id,    sellerId: seller2._id, price: 29.99,  stock: 90,  tags: ["clothing","polo"],       variants: [{ size: "M", color: "White", sku: "PL-WHT-M" }, { size: "L", color: "Navy", sku: "PL-NVY-L" }] },
      { name: "Yoga Pants",               description: "High-waist stretch yoga pants",                      categoryId: clothing._id,    sellerId: seller2._id, price: 34.99,  stock: 75,  tags: ["clothing","yoga"],       attributes: { fabric: "Nylon Spandex" } },
      { name: "Formal Dress Shirt",       description: "Slim fit cotton blend dress shirt",                  categoryId: clothing._id,    sellerId: seller2._id, price: 44.99,  stock: 45,  tags: ["clothing","formal"],     variants: [{ size: "M", color: "White", sku: "DS-WHT-M" }, { size: "L", color: "Blue", sku: "DS-BLU-L" }] },
      { name: "Cargo Trousers",           description: "Multipocket cargo trousers",                         categoryId: clothing._id,    sellerId: seller2._id, price: 54.99,  stock: 40,  tags: ["clothing","cargo"] },
      { name: "Sports Bra",               description: "High-impact sports bra with maximum support",        categoryId: clothing._id,    sellerId: seller2._id, price: 29.99,  stock: 65,  tags: ["clothing","sports"] },
      { name: "Knit Sweater",             description: "Warm chunky knit sweater",                           categoryId: clothing._id,    sellerId: seller2._id, price: 59.99,  stock: 35,  tags: ["clothing","winter"],     attributes: { fabric: "100% Merino Wool" } },
      { name: "Linen Trousers",           description: "Breathable linen trousers for summer",               categoryId: clothing._id,    sellerId: seller2._id, price: 39.99,  stock: 50,  tags: ["clothing","casual"],     attributes: { fabric: "100% Linen" } },
      { name: "Waterproof Rain Jacket",   description: "Lightweight packable waterproof jacket",             categoryId: clothing._id,    sellerId: seller2._id, price: 79.99,  stock: 25,  tags: ["clothing","outdoor"] },
      { name: "Compression Socks",        description: "Medical-grade compression socks for travel",         categoryId: clothing._id,    sellerId: seller2._id, price: 14.99,  stock: 120, tags: ["clothing","accessories"] },
      { name: "Beanie Hat",               description: "Warm knit beanie hat for winter",                    categoryId: clothing._id,    sellerId: seller2._id, price: 12.99,  stock: 100, tags: ["clothing","winter"] },

      // Home & Garden (8)
      { name: "Wall Clock",               description: "Modern minimalist wall clock",                       categoryId: homeGarden._id,  sellerId: seller2._id, price: 24.99,  stock: 45,  tags: ["home","decor"] },
      { name: "Scented Candle Set",       description: "Set of 3 soy-wax scented candles",                  categoryId: homeGarden._id,  sellerId: seller2._id, price: 19.99,  stock: 80,  tags: ["home","candles"] },
      { name: "Planter Pot Set",          description: "Set of 3 ceramic planters for indoor plants",        categoryId: homeGarden._id,  sellerId: seller2._id, price: 34.99,  stock: 55,  tags: ["garden","plants"] },
      { name: "Throw Pillow Covers",      description: "Set of 4 decorative throw pillow covers",            categoryId: homeGarden._id,  sellerId: seller2._id, price: 22.99,  stock: 70,  tags: ["home","decor"] },
      { name: "Kitchen Knife Set",        description: "6-piece stainless steel kitchen knife set",          categoryId: homeGarden._id,  sellerId: seller2._id, price: 59.99,  stock: 30,  tags: ["kitchen","cooking"],     attributes: { material: "German stainless steel" } },
      { name: "Bamboo Cutting Board",     description: "Large bamboo cutting board with juice grooves",      categoryId: homeGarden._id,  sellerId: seller2._id, price: 27.99,  stock: 50,  tags: ["kitchen","bamboo"] },
      { name: "Non-Stick Pan Set",        description: "3-piece non-stick cookware set",                     categoryId: homeGarden._id,  sellerId: seller2._id, price: 74.99,  stock: 20,  tags: ["kitchen","cookware"],    attributes: { coating: "PFOA-free ceramic" } },
      { name: "Bedside Table Lamp",       description: "Touch-controlled dimmable bedside lamp",             categoryId: homeGarden._id,  sellerId: seller2._id, price: 44.99,  stock: 35,  tags: ["home","lighting"] },

      // Books (4)
      { name: "MongoDB: The Definitive Guide", description: "Comprehensive guide to MongoDB by Kristina Chodorow", categoryId: books._id, sellerId: seller1._id, price: 39.99, stock: 20, tags: ["books","database","mongodb"] },
      { name: "Redis in Action",               description: "Practical guide to Redis by Josiah L. Carlson",      categoryId: books._id, sellerId: seller1._id, price: 34.99, stock: 15, tags: ["books","database","redis"] },
      { name: "Clean Code",                    description: "A handbook of agile software craftsmanship by Robert C. Martin", categoryId: books._id, sellerId: seller1._id, price: 29.99, stock: 25, tags: ["books","programming"] },
      { name: "NoSQL Distilled",               description: "A brief guide to the emerging world of polyglot persistence", categoryId: books._id, sellerId: seller1._id, price: 32.99, stock: 18, tags: ["books","database","nosql"] },

      // Sports & Outdoors (3)
      { name: "Yoga Mat",                 description: "Non-slip premium yoga mat 6mm thickness",            categoryId: sports._id,     sellerId: seller2._id, price: 29.99,  stock: 60,  tags: ["sports","yoga"] },
      { name: "Water Bottle 1L",          description: "Insulated stainless steel water bottle",             categoryId: sports._id,     sellerId: seller2._id, price: 22.99,  stock: 90,  tags: ["sports","hydration"],    attributes: { insulation: "Double-wall vacuum", capacity: "1L" } },
      { name: "Resistance Bands Set",     description: "Set of 5 resistance bands for home workouts",        categoryId: sports._id,     sellerId: seller2._id, price: 18.99,  stock: 75,  tags: ["sports","fitness"] },
    ];

    const result = await Product.insertMany(products);
    console.log(`✓ Seeded ${result.length} products`);

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
