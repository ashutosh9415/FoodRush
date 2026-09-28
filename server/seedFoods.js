const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Food = require("./models/Food");

dotenv.config();

const foods = [
  {
    name: "Chicken Burger",
    description:
      "Juicy chicken burger with fresh vegetables and special sauce.",
    price: 199,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
    category: "Burger",
    restaurant: "FoodRush Restaurant",
  },

  {
    name: "Margherita Pizza",
    description:
      "Classic pizza topped with tomato sauce, mozzarella and fresh basil.",
    price: 249,
    image:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002",
    category: "Pizza",
    restaurant: "FoodRush Restaurant",
  },

  {
    name: "French Fries",
    description:
      "Crispy golden French fries served with delicious seasoning.",
    price: 99,
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
    category: "Sides",
    restaurant: "FoodRush Restaurant",
  },

  {
    name: "Chicken Biryani",
    description:
      "Aromatic basmati rice cooked with tender chicken and special spices.",
    price: 299,
    image:
      "https://images.unsplash.com/photo-1563379091339-03246963d96c",
    category: "Biryani",
    restaurant: "FoodRush Restaurant",
  },

  {
    name: "Veg Biryani",
    description:
      "Fragrant basmati rice cooked with fresh vegetables and spices.",
    price: 229,
    image:
      "https://images.unsplash.com/photo-1599043513900-ed6fe01d3833",
    category: "Biryani",
    restaurant: "FoodRush Restaurant",
  },

  {
    name: "White Sauce Pasta",
    description:
      "Creamy pasta prepared with white sauce, herbs and vegetables.",
    price: 219,
    image:
      "https://images.unsplash.com/photo-1645112411341-6c4fd023714a",
    category: "Pasta",
    restaurant: "FoodRush Restaurant",
  },

  {
    name: "Red Sauce Pasta",
    description:
      "Delicious pasta cooked in rich tomato sauce with Italian herbs.",
    price: 199,
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9",
    category: "Pasta",
    restaurant: "FoodRush Restaurant",
  },

  {
    name: "Veg Momos",
    description:
      "Steamed vegetable momos served with spicy red chutney.",
    price: 129,
    image:
      "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9",
    category: "Momos",
    restaurant: "FoodRush Restaurant",
  },

  {
    name: "Chicken Momos",
    description:
      "Steamed chicken momos filled with juicy seasoned chicken.",
    price: 159,
    image:
      "https://images.unsplash.com/photo-1496116218417-1a781b1c416c",
    category: "Momos",
    restaurant: "FoodRush Restaurant",
  },

  {
    name: "Paneer Tikka",
    description:
      "Grilled paneer cubes marinated with Indian spices and yogurt.",
    price: 249,
    image:
      "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8",
    category: "Starters",
    restaurant: "FoodRush Restaurant",
  },

  {
    name: "Masala Dosa",
    description:
      "Crispy South Indian dosa served with potato masala and chutney.",
    price: 149,
    image:
      "https://images.unsplash.com/photo-1668236543090-82eba5ee5976",
    category: "South Indian",
    restaurant: "FoodRush Restaurant",
  },

  {
    name: "Chole Bhature",
    description:
      "Spicy chickpea curry served with fluffy fried bhature.",
    price: 179,
    image:
      "https://images.unsplash.com/photo-1626132647523-66f5bf380027",
    category: "North Indian",
    restaurant: "FoodRush Restaurant",
  },

  {
    name: "Chocolate Cake",
    description:
      "Soft and rich chocolate cake topped with creamy chocolate frosting.",
    price: 149,
    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
    category: "Dessert",
    restaurant: "FoodRush Restaurant",
  },

  {
    name: "Chocolate Brownie",
    description:
      "Warm chocolate brownie with a rich and fudgy center.",
    price: 129,
    image:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476b",
    category: "Dessert",
    restaurant: "FoodRush Restaurant",
  },

  {
    name: "Cold Coffee",
    description:
      "Chilled creamy coffee blended with milk and chocolate.",
    price: 119,
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735",
    category: "Beverages",
    restaurant: "FoodRush Restaurant",
  },
];

const seedFoods = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URL
    );

    console.log("MongoDB connected");

    await Food.deleteMany({});

    await Food.insertMany(foods);

    console.log(
      `${foods.length} food items inserted successfully`
    );

    await mongoose.disconnect();

    console.log("MongoDB disconnected");

    process.exit(0);
  } catch (error) {
    console.error(
      "Error inserting foods:",
      error.message
    );

    process.exit(1);
  }
};

seedFoods();