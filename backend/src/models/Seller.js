const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    storeName: {
      type: String,
      required: true,
    },

    description: String,

    rating: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seller", sellerSchema);