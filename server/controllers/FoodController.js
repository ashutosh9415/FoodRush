const Food = require("../models/Food");
const User = require("../models/User");

// ======================================
// Get All Foods
// Used by Client
// ======================================
const getAllFoods = async (req, res) => {
  try {
    const foods = await Food.find()
      .populate(
        "shopkeeper",
        "name shopName shopAddress shopImage isShopOpen shopLocation"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      count: foods.length,
      foods,
    });
  } catch (error) {
    console.error("Get all foods error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================
// Get My Foods
// ONLY logged-in Shopkeeper
// ======================================
const getMyFoods = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "_id name role shopName"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role !== "shopkeeper") {
      return res.status(403).json({
        message: "Only shopkeepers can access their food items",
      });
    }

    // IMPORTANT:
    // Only foods belonging to the logged-in shopkeeper
    const foods = await Food.find({
      shopkeeper: user._id,
    })
      .populate(
        "shopkeeper",
        "name shopName shopAddress shopImage isShopOpen shopLocation"
      )
      .sort({
        createdAt: -1,
      });

    console.log(
      `Shopkeeper ${user.name} (${user._id}) requested own foods`
    );

    console.log(
      "Foods returned:",
      foods.map((food) => ({
        id: food._id,
        name: food.name,
        shopkeeper:
          food.shopkeeper?._id?.toString() || null,
        shopName:
          food.shopkeeper?.shopName || null,
      }))
    );

    return res.status(200).json({
      count: foods.length,
      foods,
    });
  } catch (error) {
    console.error("Get my foods error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================
// Create Food
// ONLY Shopkeeper
// Image can be URL OR uploaded file
// ======================================
const createFood = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      restaurant,
    } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role !== "shopkeeper") {
      return res.status(403).json({
        message: "Only shopkeepers can add food items",
      });
    }

    // ----------------------------------
    // Check food fields
    // ----------------------------------
    if (
      !name ||
      !description ||
      price === undefined ||
      !category ||
      !restaurant
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // ----------------------------------
    // IMAGE
    // URL OR UPLOADED FILE
    // ----------------------------------

    let image = "";

    // If user uploaded an image
    if (req.file) {
      image = `/uploads/foods/${req.file.filename}`;
    }

    // Otherwise use image URL
    else if (req.body.image) {
      image = req.body.image.trim();
    }

    // No URL and no uploaded image
    if (!image) {
      return res.status(400).json({
        message:
          "Please enter a Food Image URL or upload a food image",
      });
    }

    // ----------------------------------
    // Create Food
    // ----------------------------------

    const food = await Food.create({
      name,
      description,
      price: Number(price),
      image,
      category,
      restaurant,
      shopkeeper: req.userId,
      isAvailable: true,
    });

    console.log(
      `Food "${food.name}" created by shopkeeper ${req.userId}`
    );

    return res.status(201).json({
      message: "Food created successfully",
      food,
    });
  } catch (error) {
    console.error("Create food error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================
// Delete Food
// ONLY Food Owner
// ======================================
const deleteFood = async (req, res) => {
  try {
    const { foodId } = req.params;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role !== "shopkeeper") {
      return res.status(403).json({
        message: "Only shopkeepers can delete food",
      });
    }

    const food = await Food.findOne({
      _id: foodId,
      shopkeeper: req.userId,
    });

    if (!food) {
      return res.status(404).json({
        message:
          "Food not found or you do not own this food",
      });
    }

    await Food.findByIdAndDelete(foodId);

    return res.status(200).json({
      message: "Food deleted successfully",
    });
  } catch (error) {
    console.error("Delete food error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================
// Update Food Availability
// ONLY Food Owner
// ======================================
const updateFoodAvailability = async (req, res) => {
  try {
    const { foodId } = req.params;
    const { isAvailable } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role !== "shopkeeper") {
      return res.status(403).json({
        message:
          "Only shopkeepers can update food availability",
      });
    }

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        message: "isAvailable must be true or false",
      });
    }

    const food = await Food.findOneAndUpdate(
      {
        _id: foodId,
        shopkeeper: req.userId,
      },
      {
        isAvailable,
      },
      {
        new: true,
      }
    );

    if (!food) {
      return res.status(404).json({
        message:
          "Food not found or you do not own this food",
      });
    }

    return res.status(200).json({
      message: "Food availability updated",
      food,
    });
  } catch (error) {
    console.error(
      "Update food availability error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================
// Get Nearby Restaurants
// ======================================
const getNearbyRestaurants = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 10,
    } = req.query;

    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        message:
          "Latitude and longitude are required",
      });
    }

    const clientLatitude = Number(latitude);
    const clientLongitude = Number(longitude);
    const searchRadius = Number(radius);

    if (
      Number.isNaN(clientLatitude) ||
      Number.isNaN(clientLongitude)
    ) {
      return res.status(400).json({
        message:
          "Invalid latitude or longitude",
      });
    }

    if (
      clientLatitude < -90 ||
      clientLatitude > 90
    ) {
      return res.status(400).json({
        message: "Invalid latitude",
      });
    }

    if (
      clientLongitude < -180 ||
      clientLongitude > 180
    ) {
      return res.status(400).json({
        message: "Invalid longitude",
      });
    }

    const calculateDistance = (
      lat1,
      lon1,
      lat2,
      lon2
    ) => {
      const earthRadius = 6371;

      const dLat =
        ((lat2 - lat1) * Math.PI) / 180;

      const dLon =
        ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) *
          Math.sin(dLat / 2) +
        Math.cos(
          (lat1 * Math.PI) / 180
        ) *
          Math.cos(
            (lat2 * Math.PI) / 180
          ) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);

      const c =
        2 *
        Math.atan2(
          Math.sqrt(a),
          Math.sqrt(1 - a)
        );

      return earthRadius * c;
    };

    const shopkeepers =
      await User.find({
        role: "shopkeeper",
        isShopOpen: true,
        "shopLocation.latitude": {
          $ne: null,
        },
        "shopLocation.longitude": {
          $ne: null,
        },
      }).select(
        "name shopName shopAddress shopPhone shopDescription shopImage shopLocation isShopOpen"
      );

    const nearbyRestaurants =
      shopkeepers
        .map((shop) => {
          const distance =
            calculateDistance(
              clientLatitude,
              clientLongitude,
              shop.shopLocation.latitude,
              shop.shopLocation.longitude
            );

          return {
            id: shop._id,
            name: shop.shopName,
            ownerName: shop.name,
            address: shop.shopAddress,
            phone: shop.shopPhone,
            description:
              shop.shopDescription,
            image: shop.shopImage,
            location: shop.shopLocation,
            isOpen: shop.isShopOpen,
            distance: Number(
              distance.toFixed(2)
            ),
          };
        })
        .filter(
          (shop) =>
            shop.distance <= searchRadius
        )
        .sort(
          (a, b) =>
            a.distance - b.distance
        );

    return res.status(200).json({
      count: nearbyRestaurants.length,
      radius: searchRadius,
      restaurants: nearbyRestaurants,
    });
  } catch (error) {
    console.error(
      "Nearby restaurants error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================
// Get Foods By Restaurant
// ======================================
const getFoodsByRestaurant = async (
  req,
  res
) => {
  try {
    const { restaurantId } = req.params;

    const restaurant =
      await User.findOne({
        _id: restaurantId,
        role: "shopkeeper",
      }).select(
        "name shopName shopAddress shopPhone shopDescription shopImage shopLocation isShopOpen"
      );

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    if (!restaurant.isShopOpen) {
      return res.status(400).json({
        message:
          "Restaurant is currently closed",
      });
    }

    const foods = await Food.find({
      shopkeeper: restaurantId,
      isAvailable: true,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      restaurant,
      foods,
    });
  } catch (error) {
    console.error(
      "Get restaurant foods error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// Get Foods From Nearest Open Shop
// CLIENT ONLY
// ==========================================
const getNearestShopFoods = async (
  req,
  res
) => {
  try {
    const {
      latitude,
      longitude,
      radius = 10,
    } = req.query;

    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        message:
          "Latitude and longitude are required",
      });
    }

    const clientLatitude = Number(latitude);
    const clientLongitude = Number(longitude);
    const searchRadius = Number(radius);

    if (
      Number.isNaN(clientLatitude) ||
      Number.isNaN(clientLongitude)
    ) {
      return res.status(400).json({
        message:
          "Invalid latitude or longitude",
      });
    }

    if (
      clientLatitude < -90 ||
      clientLatitude > 90
    ) {
      return res.status(400).json({
        message: "Invalid latitude",
      });
    }

    if (
      clientLongitude < -180 ||
      clientLongitude > 180
    ) {
      return res.status(400).json({
        message: "Invalid longitude",
      });
    }

    if (
      Number.isNaN(searchRadius) ||
      searchRadius <= 0
    ) {
      return res.status(400).json({
        message:
          "Invalid search radius",
      });
    }

    const calculateDistance = (
      lat1,
      lon1,
      lat2,
      lon2
    ) => {
      const earthRadius = 6371;

      const dLat =
        ((lat2 - lat1) * Math.PI) / 180;

      const dLon =
        ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) *
          Math.sin(dLat / 2) +
        Math.cos(
          (lat1 * Math.PI) / 180
        ) *
          Math.cos(
            (lat2 * Math.PI) / 180
          ) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);

      const c =
        2 *
        Math.atan2(
          Math.sqrt(a),
          Math.sqrt(1 - a)
        );

      return earthRadius * c;
    };

    const shopkeepers =
      await User.find({
        role: "shopkeeper",
        isShopOpen: true,
        "shopLocation.latitude": {
          $ne: null,
        },
        "shopLocation.longitude": {
          $ne: null,
        },
      }).select(
        "name shopName shopAddress shopPhone shopDescription shopImage shopLocation isShopOpen"
      );

    if (shopkeepers.length === 0) {
      return res.status(200).json({
        message: "No open shops found",
        shop: null,
        foods: [],
      });
    }

    const shopsWithDistance =
      shopkeepers.map((shop) => {
        const distance =
          calculateDistance(
            clientLatitude,
            clientLongitude,
            shop.shopLocation.latitude,
            shop.shopLocation.longitude
          );

        return {
          shop,
          distance: Number(
            distance.toFixed(2)
          ),
        };
      });

    const nearbyShops =
      shopsWithDistance.filter(
        (item) =>
          item.distance <= searchRadius
      );

    if (nearbyShops.length === 0) {
      return res.status(200).json({
        message:
          "No open shop found near your location",
        shop: null,
        foods: [],
      });
    }

    nearbyShops.sort(
      (a, b) =>
        a.distance - b.distance
    );

    const nearestShop =
      nearbyShops[0];

    // IMPORTANT:
    // Only foods belonging to the nearest
    // shopkeeper are returned.
    //
    // Do NOT search by restaurant name.
    const foods = await Food.find({
      isAvailable: true,
    })
      .populate(
        "shopkeeper",
        "name shopName shopAddress shopImage"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      message:
        "Nearest shop foods fetched successfully",

      shop: {
        id: nearestShop.shop._id,
        name: nearestShop.shop.shopName,
        ownerName: nearestShop.shop.name,
        address:
          nearestShop.shop.shopAddress,
        phone:
          nearestShop.shop.shopPhone,
        description:
          nearestShop.shop.shopDescription,
        image:
          nearestShop.shop.shopImage,
        location:
          nearestShop.shop.shopLocation,
        distance:
          nearestShop.distance,
        isOpen:
          nearestShop.shop.isShopOpen,
      },

      count: foods.length,
      foods,
    });
  } catch (error) {
    console.error(
      "Nearest shop foods error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// UPDATE FOOD
// ==========================================

const updateFood = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      restaurant,
      image,
    } = req.body;

    const food = await Food.findById(req.params.foodId);

    if (!food) {
      return res.status(404).json({
        message: "Food item not found",
      });
    }

    // Only the shopkeeper who created this food
    // can edit it.
    if (
      !food.shopkeeper ||
      food.shopkeeper.toString() !== req.userId
    ) {
      return res.status(403).json({
        message: "You can only edit your own food items",
      });
    }

    // Update normal fields only when provided
    if (name !== undefined) {
      food.name = name.trim();
    }

    if (description !== undefined) {
      food.description = description.trim();
    }

    if (price !== undefined) {
      food.price = Number(price);
    }

    if (category !== undefined) {
      food.category = category.trim();
    }

    if (restaurant !== undefined) {
      food.restaurant = restaurant.trim();
    }

    // If a new file was uploaded
    if (req.file) {
      food.image = `/uploads/foods/${req.file.filename}`;
    }

    // Otherwise, if a URL was provided
    else if (image !== undefined && image.trim()) {
      food.image = image.trim();
    }

    await food.save();

    console.log(
      `Food "${food.name}" updated by shopkeeper ${req.userId}`
    );

    return res.status(200).json({
      message: "Food item updated successfully",
      food,
    });
  } catch (error) {
    console.error("Update food error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================
// EXPORTS
// ======================================
module.exports = {
  getAllFoods,
  getMyFoods,
  createFood,
  updateFood,
  deleteFood,
  updateFoodAvailability,
  getNearbyRestaurants,
  getFoodsByRestaurant,
  getNearestShopFoods,
};