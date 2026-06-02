const Inventory = require("../models/Inventory");

const getLowStockProductsAggregation = async () => {
  return await Inventory.aggregate([
    {
      $match: {
        $expr: { $lt: ["$stock", "$lowStockThreshold"] },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $lookup: {
        from: "sellers",
        localField: "product.sellerId",
        foreignField: "_id",
        as: "seller",
      },
    },
    { $unwind: "$seller" },
    {
      $project: {
        productName: "$product.name",
        currentStock: "$stock",
        threshold: "$lowStockThreshold",
        sellerName: "$seller.storeName",
        price: "$product.price",
        stockPercentage: {
          $multiply: [{ $divide: ["$stock", "$lowStockThreshold"] }, 100],
        },
      },
    },
    { $sort: { stockPercentage: 1 } },
  ]);
};

const getCriticalStockProducts = async () => {
  return await Inventory.aggregate([
    {
      $match: {
        $expr: { $eq: ["$stock", 0] },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
  ]);
};

module.exports = {
  getLowStockProductsAggregation,
  getCriticalStockProducts,
};
