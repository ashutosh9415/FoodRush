const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ======================================
    // Common User Details
    // ======================================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    // ======================================
    // User Role
    // ======================================

    role: {
      type: String,
      enum: [
        "client",
        "shopkeeper",
        "deliveryboy",
      ],
      default: "client",
    },

    // ======================================
    // Client Current Location
    // ======================================

    location: {
      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },
    },

    // ======================================
    // Delivery Boy Status
    // ======================================

    isActive: {
      type: Boolean,
      default: false,
    },

    isAvailable: {
      type: Boolean,
      default: false,
    },

    // ======================================
    // Shopkeeper Restaurant Details
    // ======================================

    shopName: {
      type: String,
      default: null,
      trim: true,
    },

    shopAddress: {
      type: String,
      default: null,
      trim: true,
    },

    shopPhone: {
      type: String,
      default: null,
      trim: true,
    },

    shopDescription: {
      type: String,
      default: null,
      trim: true,
    },

    shopImage: {
      type: String,
      default: null,
    },

    // ======================================
    // Restaurant Location
    // ======================================

    shopLocation: {
      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },
    },

    // ======================================
    // Restaurant Availability
    // ======================================

    isShopOpen: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model(
  "User",
  userSchema
);

module.exports = User;