/**
 * MongoDB Indexes Configuration
 * This file documents all the indexes created on MongoDB collections
 * for optimal query performance
 */

const indexes = {
  users: [
    {
      fields: { email: 1 },
      options: { unique: true },
      purpose: "Ensure email uniqueness and fast login lookups"
    },
    {
      fields: { createdAt: -1 },
      options: {},
      purpose: "Sort users by creation date"
    }
  ],
  
  products: [
    {
      fields: { categoryId: 1 },
      options: {},
      purpose: "Filter products by category"
    },
    {
      fields: { sellerId: 1 },
      options: {},
      purpose: "Filter products by seller"
    },
    {
      fields: { name: "text", description: "text" },
      options: {},
      purpose: "Full-text search on product name and description"
    },
    {
      fields: { price: 1 },
      options: {},
      purpose: "Filter products by price range"
    },
    {
      fields: { createdAt: -1 },
      options: {},
      purpose: "Sort products by newest first"
    }
  ],
  
  orders: [
    {
      fields: { userId: 1, createdAt: -1 },
      options: { compound: true },
      purpose: "Get user's orders sorted by date"
    },
    {
      fields: { status: 1 },
      options: {},
      purpose: "Filter orders by status"
    },
    {
      fields: { createdAt: -1 },
      options: {},
      purpose: "Get recent orders"
    }
  ],
  
  reviews: [
    {
      fields: { productId: 1 },
      options: {},
      purpose: "Get all reviews for a product"
    },
    {
      fields: { userId: 1 },
      options: {},
      purpose: "Get all reviews by a user"
    },
    {
      fields: { rating: -1 },
      options: {},
      purpose: "Sort reviews by rating"
    }
  ],
  
  inventory: [
    {
      fields: { productId: 1 },
      options: { unique: true },
      purpose: "One inventory record per product"
    },
    {
      fields: { quantity: 1 },
      options: {},
      purpose: "Find low stock items"
    }
  ]
};

module.exports = indexes;
