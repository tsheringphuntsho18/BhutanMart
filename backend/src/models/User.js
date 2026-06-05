const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      enum: ["Home", "Office", "Other"],
      default: "Home",
    },
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },

    addresses: [addressSchema],

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    paymentPreference: {
      type: String,
      default: "COD",
    },

    avatar: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);