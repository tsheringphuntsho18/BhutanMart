const Order = require("../models/Order");

const getTopProductsByQuantity = async (limit = 10) => {
  return await Order.aggregate([
    { $match: { status: { $in: ["Delivered", "Confirmed"] } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        totalQuantitySold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        productName: { $first: "$items.name" },
      },
    },
    { $sort: { totalQuantitySold: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
  ]);
};

const getTopProductsByRevenue = async (limit = 10) => {
  return await Order.aggregate([
    { $match: { status: { $in: ["Delivered", "Confirmed"] } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        totalQuantitySold: { $sum: "$items.quantity" },
        productName: { $first: "$items.name" },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
  ]);
};

module.exports = {
  getTopProductsByQuantity,
  getTopProductsByRevenue,
};
