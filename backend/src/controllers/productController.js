const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const { redisClient } = require("../config/redis");
const { getPaginationParams, buildPaginationResponse } = require("../utils/pagination");
const { addRecentlyViewed } = require("../services/recentlyViewedService");
const { incrementView } = require("../services/trendingService");

// Get all products with search and filtering
const getAllProducts = async (req, res) => {
  try {
    const { page: rawPage, limit: rawLimit, search, categoryId, minPrice, maxPrice, sortBy } = req.query;
    const { page, limit, skip } = getPaginationParams(rawPage, rawLimit);

    // Build filter
    let filter = {};

    if (search) {
      filter.$text = { $search: search };
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build sort
    let sort = { createdAt: -1 };
    if (sortBy === "price_asc") sort = { price: 1 };
    if (sortBy === "price_desc") sort = { price: -1 };
    if (sortBy === "rating") sort = { rating: -1 };

    const products = await Product.find(filter)
      .populate("categoryId", "name")
      .populate("sellerId", "storeName")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Product.countDocuments(filter);

    const response = buildPaginationResponse(products, totalCount, page, limit);

    res.json(response);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    // Try to get from cache
    let product = await redisClient.get(`product:${productId}`);
    let cached = false;

    if (product) {
      product = JSON.parse(product);
      cached = true;
    } else {
      // Get from DB
      product = await Product.findById(productId)
        .populate("categoryId", "name")
        .populate("sellerId", "storeName rating");

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Cache the product
      await redisClient.setEx(
        `product:${productId}`,
        3600,
        JSON.stringify(product)
      );
    }

    // Always track — regardless of cache hit or miss
    await redisClient.pfAdd(`page_views:${productId}`, req.ip);
    await incrementView(productId).catch(() => {});
    if (req.user) {
      await addRecentlyViewed(req.user._id.toString(), productId).catch(() => {});
    }

    res.json({ product, cached });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

// Create product (seller)
const createProduct = async (req, res) => {
  try {
    const { name, description, categoryId, price, stock, variants, attributes, tags, imageUrl } = req.body;

    if (!name || !categoryId || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Use the Seller document's _id so getMyProducts/getSellerOrders queries work correctly
    const Seller = require("../models/Seller");
    const seller = await Seller.findOne({ owner: req.user._id });
    if (!seller) {
      return res.status(400).json({ error: "Seller profile not found. Please complete your seller setup first." });
    }

    const product = new Product({
      name,
      description,
      categoryId,
      sellerId: seller._id,
      price,
      stock,
      variants,
      attributes,
      tags,
      imageUrl,
    });

    await product.save();

    // Always create the paired Inventory record so orders can check stock
    await Inventory.create({
      productId: product._id,
      stock: stock || 0,
      lowStockThreshold: 10,
    });

    await product.populate("categoryId", "name");
    await product.populate("sellerId", "storeName");

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, price, stock, variants, attributes, tags, imageUrl } = req.body;

    const product = await Product.findByIdAndUpdate(
      productId,
      { name, description, price, stock, variants, attributes, tags, imageUrl },
      { new: true, runValidators: true }
    ).populate("categoryId", "name").populate("sellerId", "storeName");

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Invalidate cache
    await redisClient.del(`product:${productId}`);

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Invalidate cache
    await redisClient.del(`product:${productId}`);

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
};

// Get recently viewed products for logged-in user
const getRecentlyViewed = async (req, res) => {
  try {
    const { getRecentlyViewed: fetchList } = require("../services/recentlyViewedService");
    const ids = await fetchList(req.user._id.toString());

    if (!ids.length) return res.json({ products: [] });

    const products = await Product.find({ _id: { $in: ids } })
      .populate("categoryId", "name")
      .lean();

    // Preserve the Redis list order
    const ordered = ids
      .map((id) => products.find((p) => p._id.toString() === id))
      .filter(Boolean);

    res.json({ products: ordered });
  } catch (error) {
    console.error("Get recently viewed error:", error);
    res.status(500).json({ error: "Failed to fetch recently viewed" });
  }
};

// Get unique visitor count for a product (HyperLogLog)
const getProductUniqueViews = async (req, res) => {
  try {
    const { productId } = req.params;
    const count = await redisClient.pfCount(`page_views:${productId}`);
    res.json({ productId, uniqueViews: count });
  } catch (error) {
    console.error("Get unique views error:", error);
    res.status(500).json({ error: "Failed to fetch view count" });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getRecentlyViewed,
  getProductUniqueViews,
};
