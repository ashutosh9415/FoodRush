const express = require("express");

const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateClientLocation,
  logoutUser,
  updateAvailability,
} = require("../controllers/UserController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Register
router.post(
  "/register",
  registerUser
);

// Login
router.post(
  "/login",
  loginUser
);

// Current User
router.get(
  "/currentuser",
  authMiddleware,
  getCurrentUser
);

// Client Location
router.put(
  "/location",
  authMiddleware,
  updateClientLocation
);

// Logout
router.post(
  "/logout",
  authMiddleware,
  logoutUser
);

// Delivery Boy Availability
router.put(
  "/availability",
  authMiddleware,
  updateAvailability
);

module.exports = router;