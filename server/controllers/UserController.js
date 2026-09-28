const User = require("../models/User");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

// ======================================
// Register User
// ======================================

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,

      // Shopkeeper details
      shopName,
      shopAddress,
      shopPhone,
      shopDescription,
      shopImage,
      latitude,
      longitude,
    } = req.body;

    // ======================================
    // Common Validation
    // ======================================

    if (
      !name ||
      !email ||
      !password ||
      !phone
    ) {
      return res.status(400).json({
        message:
          "Name, email, password and phone are required",
      });
    }

    // ======================================
    // Allowed Roles
    // ======================================

    const allowedRoles = [
      "client",
      "shopkeeper",
      "deliveryboy",
    ];

    const selectedRole =
      role || "client";

    if (
      !allowedRoles.includes(
        selectedRole
      )
    ) {
      return res.status(400).json({
        message: "Invalid user role",
      });
    }

    // ======================================
    // Shopkeeper Validation
    // ======================================

    if (
      selectedRole ===
      "shopkeeper"
    ) {
      if (
        !shopName ||
        !shopAddress ||
        !shopPhone ||
        !shopDescription ||
        latitude === undefined ||
        longitude === undefined
      ) {
        return res.status(400).json({
          message:
            "Shop name, address, phone, description and location are required for shopkeepers",
        });
      }

      if (
        typeof latitude !==
          "number" ||
        latitude < -90 ||
        latitude > 90
      ) {
        return res.status(400).json({
          message:
            "Invalid latitude",
        });
      }

      if (
        typeof longitude !==
          "number" ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({
          message:
            "Invalid longitude",
        });
      }
    }

    // ======================================
    // Check Existing User
    // ======================================

    const existingUser =
      await User.findOne({
        email: email
          .toLowerCase()
          .trim(),
      });

    if (existingUser) {
      return res.status(400).json({
        message:
          "User already exists",
      });
    }

    // ======================================
    // Hash Password
    // ======================================

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    // ======================================
    // Common User Data
    // ======================================

    const userData = {
      name: name.trim(),

      email: email
        .toLowerCase()
        .trim(),

      password:
        hashedPassword,

      phone: phone.trim(),

      role: selectedRole,
    };

    // ======================================
    // Shopkeeper Data
    // ======================================

    if (
      selectedRole ===
      "shopkeeper"
    ) {
      userData.shopName =
        shopName.trim();

      userData.shopAddress =
        shopAddress.trim();

      userData.shopPhone =
        shopPhone.trim();

      userData.shopDescription =
        shopDescription.trim();

      userData.shopImage =
        shopImage || null;

      userData.shopLocation = {
        latitude:
          Number(latitude),

        longitude:
          Number(longitude),
      };

      userData.isShopOpen =
        true;
    }

    // ======================================
    // Create User
    // ======================================

    const user =
      await User.create(
        userData
      );

    // ======================================
    // Response
    // ======================================

    res.status(201).json({
      message:
        "User registered successfully",

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        phone: user.phone,

        role: user.role,

        isActive:
          user.isActive,

        isAvailable:
          user.isAvailable,

        location:
          user.location,

        shopName:
          user.shopName,

        shopAddress:
          user.shopAddress,

        shopPhone:
          user.shopPhone,

        shopDescription:
          user.shopDescription,

        shopImage:
          user.shopImage,

        shopLocation:
          user.shopLocation,

        isShopOpen:
          user.isShopOpen,
      },
    });
  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    res.status(500).json({
      message:
        "Server error",
    });
  }
};

// ======================================
// Login User
// ======================================

const loginUser = async (
  req,
  res
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (
      !email ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const user =
      await User.findOne({
        email: email
          .toLowerCase()
          .trim(),
      });

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    // ======================================
    // JWT
    // ======================================

    const token =
      jwt.sign(
        {
          userId:
            user._id,
        },
        process.env.JWT_SECRET,
        {
          expiresIn:
            "7d",
        }
      );

    // ======================================
    // Cookie
    // ======================================

    res.cookie(
      "token",
      token,
      {
        httpOnly: true,

        secure: false,

        sameSite: "lax",

        maxAge:
          7 *
          24 *
          60 *
          60 *
          1000,
      }
    );

    // ======================================
    // Response
    // ======================================

    res.status(200).json({
      message:
        "Login successful",

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        phone: user.phone,

        role: user.role,

        isActive:
          user.isActive,

        isAvailable:
          user.isAvailable,

        location:
          user.location,

        shopName:
          user.shopName,

        shopAddress:
          user.shopAddress,

        shopPhone:
          user.shopPhone,

        shopDescription:
          user.shopDescription,

        shopImage:
          user.shopImage,

        shopLocation:
          user.shopLocation,

        isShopOpen:
          user.isShopOpen,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      message:
        "Server error",
    });
  }
};

// ======================================
// Current User
// ======================================

const getCurrentUser =
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.userId
        ).select(
          "-password"
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      res.status(200).json({
        user,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };

// ======================================
// Update Client Location
// ======================================
// ======================================
// Update Client Location
// ======================================

const updateClientLocation =
  async (req, res) => {
    try {
      const {
        latitude,
        longitude,
      } = req.body;

      // Check location values

      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number"
      ) {
        return res.status(400).json({
          message:
            "Latitude and longitude must be numbers",
        });
      }

      // Check latitude

      if (
        latitude < -90 ||
        latitude > 90
      ) {
        return res.status(400).json({
          message:
            "Invalid latitude",
        });
      }

      // Check longitude

      if (
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({
          message:
            "Invalid longitude",
        });
      }

      // Find logged-in user

      const user =
        await User.findById(
          req.userId
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      // Only client can update location

      if (
        user.role !== "client"
      ) {
        return res.status(403).json({
          message:
            "Only clients can update their location",
        });
      }

      // Update location

      const updatedUser =
        await User.findByIdAndUpdate(
          req.userId,
          {
            location: {
              latitude: latitude,
              longitude: longitude,
            },
          },
          {
            new: true,
            runValidators: false,
          }
        );

      // Send response

      res.status(200).json({
        message:
          "Location updated successfully",

        location:
          updatedUser.location,
      });

    } catch (error) {

      console.error(
        "Location update error:",
        error
      );

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };
// ======================================
// Logout
// ======================================

const logoutUser = async (
  req,
  res
) => {
  try {
    res.clearCookie(
      "token",
      {
        httpOnly: true,

        secure: false,

        sameSite: "lax",
      }
    );

    res.status(200).json({
      message:
        "Logout successful",
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Server error",
    });
  }
};

// ======================================
// Delivery Boy Availability
// ======================================

const updateAvailability =
  async (req, res) => {
    try {
      const {
        isActive,
        isAvailable,
      } = req.body;

      const user =
        await User.findById(
          req.userId
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      if (
        user.role !==
        "deliveryboy"
      ) {
        return res.status(403).json({
          message:
            "Only delivery boys can change availability",
        });
      }

      user.isActive =
        Boolean(isActive);

      user.isAvailable =
        Boolean(isAvailable);

      await user.save();

      res.status(200).json({
        message:
          user.isActive
            ? "You are now online"
            : "You are now offline",

        user: {
          id: user._id,

          name: user.name,

          email: user.email,

          phone: user.phone,

          role: user.role,

          isActive:
            user.isActive,

          isAvailable:
            user.isAvailable,
        },
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateClientLocation,
  logoutUser,
  updateAvailability,
};