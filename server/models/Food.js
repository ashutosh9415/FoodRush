const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    // Food name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Food description
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Food price
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Food image
    image: {
      type: String,
      required: true,
    },

    // Food category
    category: {
      type: String,
      required: true,
      trim: true,
    },

    // Restaurant / brand name
    restaurant: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================
    // Shopkeeper who owns this food item
    // =====================================
    shopkeeper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Food availability
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Food = mongoose.model(
  "Food",
  foodSchema
);

module.exports = Food;