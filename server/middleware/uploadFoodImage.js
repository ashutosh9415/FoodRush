const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ======================================
// Upload Directory
// ======================================

const uploadDirectory = path.join(
  __dirname,
  "../uploads/foods"
);

// Create folder if it does not exist
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

// ======================================
// Storage
// ======================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const fileName =
      "food-" +
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      extension;

    cb(null, fileName);
  },
});

// ======================================
// File Filter
// ======================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      ),
      false
    );
  }
};

// ======================================
// Multer Upload
// ======================================

const uploadFoodImage = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ======================================
// Export
// ======================================

module.exports = uploadFoodImage;