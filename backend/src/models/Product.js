const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    size: String,
    color: String,
    sku: String,
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      text: true,
    },

    description: {
      type: String,
      text: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    stock: {
      type: Number,
      default: 0,
    },

    variants: [variantSchema],

    attributes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    tags: [String],

    imageUrl: String,
  },
  { timestamps: true }
);

productSchema.index({
  name: "text",
  description: "text",
  tags: "text",
});

productSchema.index({
  categoryId: 1,
  price: -1,
});

module.exports = mongoose.model("Product", productSchema);