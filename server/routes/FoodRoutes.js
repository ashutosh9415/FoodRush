const express = require("express");

const router = express.Router();

const uploadFoodImage = require("../middleware/uploadFoodImage");

const {
  getAllFoods,
  getMyFoods,
  createFood,
  updateFood,
  deleteFood,
  updateFoodAvailability,
  getNearbyRestaurants,
  getFoodsByRestaurant,
  getNearestShopFoods,
} = require("../controllers/FoodController");

const authMiddleware = require("../middleware/authMiddleware");

// ======================================
// CLIENT
// Get all foods
// ======================================
router.get("/", getAllFoods);

// ======================================
// SHOPKEEPER ONLY
// Get foods belonging to logged-in shopkeeper
// ======================================
router.get(
  "/my-foods",
  authMiddleware,
  getMyFoods
);

// ======================================
// CLIENT
// Get nearby restaurants
// ======================================
router.get(
  "/nearby-restaurants",
  getNearbyRestaurants
);

// ======================================
// CLIENT
// Get foods from specific restaurant
// ======================================
router.get(
  "/restaurant/:restaurantId",
  getFoodsByRestaurant
);

// ======================================
// CLIENT ONLY
// Get foods from nearest open shop
// ======================================
router.get(
  "/nearest-shop-foods",
  authMiddleware,
  getNearestShopFoods
);

// ======================================
// SHOPKEEPER
// Create food
// ======================================
router.post(
  "/",
  authMiddleware,
  uploadFoodImage.single("image"),
  createFood
);

router.put(
  "/:foodId",
  authMiddleware,
  uploadFoodImage.single("image"),
  updateFood
);

// ======================================
// SHOPKEEPER
// Delete own food
// ======================================
router.delete(
  "/:foodId",
  authMiddleware,
  deleteFood
);

// ======================================
// SHOPKEEPER
// Update own food availability
// ======================================
router.put(
  "/:foodId/availability",
  authMiddleware,
  updateFoodAvailability
);

module.exports = router;