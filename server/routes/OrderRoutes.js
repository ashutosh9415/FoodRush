const express = require("express");

const {
  createOrder,
  verifyPayment,
  getMyOrders,
  getShopkeeperOrders,
  getOrderById,
  updateOrderStatus,
  acceptDeliveryOrder,
  rejectDeliveryOrder,
  startDelivery,
  verifyDeliveryOTP,
} = require("../controllers/OrderController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  createOrder
);

router.post(
  "/verify-payment",
  authMiddleware,
  verifyPayment
);

router.get(
  "/my-orders",
  authMiddleware,
  getMyOrders
);

router.get(
  "/shopkeeper-orders",
  authMiddleware,
  getShopkeeperOrders
);

router.post(
  "/:orderId/accept",
  authMiddleware,
  acceptDeliveryOrder
);

router.post(
  "/:orderId/reject",
  authMiddleware,
  rejectDeliveryOrder
);

router.put(
  "/:orderId/start-delivery",
  authMiddleware,
  startDelivery
);

router.post(
  "/:orderId/verify-otp",
  authMiddleware,
  verifyDeliveryOTP
);

router.put(
  "/:orderId/status",
  authMiddleware,
  updateOrderStatus
);

// Single order MUST BE LAST
router.get(
  "/:orderId",
  authMiddleware,
  getOrderById
);

module.exports = router;