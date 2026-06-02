const Order = require("../models/Order");

const getMonthlyRevenueAggregation = async (month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ["Delivered", "Confirmed"] },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        dailyRevenue: { $sum: "$totalAmount" },
        ordersCount: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);
};

const getYearlyRevenueAggregation = async (year) => {
  return await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 11, 31),
        },
        status: { $in: ["Delivered", "Confirmed"] },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        monthlyRevenue: { $sum: "$totalAmount" },
        ordersCount: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);
};

module.exports = {
  getMonthlyRevenueAggregation,
  getYearlyRevenueAggregation,
};
