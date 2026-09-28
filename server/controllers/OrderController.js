const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const Order = require("../models/Order");
const User = require("../models/User");
const Food = require("../models/Food");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// =====================================================
// CREATE ORDER
// =====================================================

const createOrder = async (req, res) => {
  try {
    const {
      items,
      totalAmount,
      address,
      location,
      paymentMethod,
    } = req.body;

    if (
      !items?.length ||
      !totalAmount ||
      !address ||
      !location ||
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number"
    ) {
      return res.status(400).json({
        message: "Order details are required",
      });
    }

    if (!["COD", "ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }

    // ---------------------------------------------
    // Validate food items from database
    // ---------------------------------------------

    const foodIds = items.map(
      (item) => item.food
    );

    const foods = await Food.find({
      _id: {
        $in: foodIds,
      },
    });

    if (foods.length !== items.length) {
      return res.status(400).json({
        message: "One or more food items are invalid",
      });
    }

    // ---------------------------------------------
    // Calculate total from database prices
    // ---------------------------------------------

    let calculatedTotal = 0;

    const orderItems = items.map((item) => {
      const food = foods.find(
        (foodItem) =>
          foodItem._id.toString() ===
          item.food.toString()
      );

      if (!food) {
        throw new Error("Food item not found");
      }

      const quantity = Number(item.quantity);

      if (!quantity || quantity < 1) {
        throw new Error(
          "Invalid food quantity"
        );
      }

      calculatedTotal +=
        Number(food.price) * quantity;

      return {
        food: food._id,
        name: food.name,
        price: food.price,
        quantity,
      };
    });

    calculatedTotal = Number(
      calculatedTotal.toFixed(2)
    );

    // ---------------------------------------------
    // Make sure client total matches server total
    // ---------------------------------------------

    if (
      Number(totalAmount) !==
      calculatedTotal
    ) {
      return res.status(400).json({
        message:
          "Order total does not match food prices",
      });
    }

    // =================================================
    // CASH ON DELIVERY
    // =================================================

    if (paymentMethod === "COD") {
      const order = await Order.create({
        user: req.userId,

        items: orderItems,

        totalAmount: calculatedTotal,

        address,

        location,

        paymentMethod: "COD",

        paymentStatus: "Pending",

        status: "Pending",
      });

      return res.status(201).json({
        message:
          "Cash on Delivery order created successfully",

        order,
      });
    }

    // =================================================
    // ONLINE PAYMENT
    // =================================================

    if (paymentMethod === "ONLINE") {
      // ---------------------------------------------
      // Create FoodRush order first
      // ---------------------------------------------

      const order = await Order.create({
        user: req.userId,

        items: orderItems,

        totalAmount: calculatedTotal,

        address,

        location,

        paymentMethod: "ONLINE",

        paymentStatus: "Pending",

        status: "Pending",
      });

      // ---------------------------------------------
      // Create Razorpay order
      // ---------------------------------------------

      const razorpayOrder =
        await razorpay.orders.create({
          amount:
            Math.round(
              calculatedTotal * 100
            ),

          currency: "INR",

          receipt:
            `foodrush_${order._id}`,

          notes: {
            foodrushOrderId:
              order._id.toString(),

            userId:
              req.userId.toString(),
          },
        });

      // ---------------------------------------------
      // Save Razorpay order ID
      // ---------------------------------------------

      order.razorpayOrderId =
        razorpayOrder.id;

      await order.save();

      return res.status(201).json({
        message:
          "Online payment order created",

        order: {
          _id: order._id,

          totalAmount:
            order.totalAmount,

          paymentMethod:
            order.paymentMethod,

          paymentStatus:
            order.paymentStatus,

          status:
            order.status,

          address:
            order.address,

          location:
            order.location,
        },

        razorpay: {
          key:
            process.env.RAZORPAY_KEY_ID,

          orderId:
            razorpayOrder.id,

          amount:
            razorpayOrder.amount,

          currency:
            razorpayOrder.currency,
        },
      });
    }

  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Server error",
    });
  }
};


// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message:
          "Payment verification details are required",
      });
    }

    // ---------------------------------------------
    // Find FoodRush order
    // ---------------------------------------------

    const order = await Order.findOne({
      razorpayOrderId:
        razorpay_order_id,

      user: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        message:
          "FoodRush order not found",
      });
    }

    // ---------------------------------------------
    // Prevent duplicate verification
    // ---------------------------------------------

    if (
      order.paymentStatus === "Paid"
    ) {
      return res.status(200).json({
        message:
          "Payment already verified",

        order,
      });
    }

    // ---------------------------------------------
    // Create server-side signature
    // ---------------------------------------------

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          `${order.razorpayOrderId}|${razorpay_payment_id}`
        )
        .digest("hex");

    // ---------------------------------------------
    // Compare signatures
    // ---------------------------------------------

    if (
      generatedSignature !==
      razorpay_signature
    ) {
      order.paymentStatus =
        "Failed";

      await order.save();

      return res.status(400).json({
        message:
          "Payment signature verification failed",
      });
    }

    // ---------------------------------------------
    // Payment verified successfully
    // ---------------------------------------------

    order.paymentStatus =
      "Paid";

    order.razorpayPaymentId =
      razorpay_payment_id;

    order.razorpaySignature =
      razorpay_signature;

    await order.save();

    // ---------------------------------------------
    // Notify customer
    // ---------------------------------------------

    req.io
      .to(`order-${order._id}`)
      .emit(
        "payment-success",
        {
          orderId:
            order._id.toString(),

          paymentStatus:
            "Paid",
        }
      );

    res.status(200).json({
      message:
        "Payment verified successfully",

      order: {
        _id:
          order._id,

        paymentMethod:
          order.paymentMethod,

        paymentStatus:
          order.paymentStatus,

        status:
          order.status,

        totalAmount:
          order.totalAmount,
      },
    });

  } catch (error) {
    console.error(
      "Payment verification error:",
      error
    );

    res.status(500).json({
      message:
        "Payment verification failed",
    });
  }
};


// =====================================================
// GET MY ORDERS
// =====================================================

const getMyOrders = async (req, res) => {
  try {
    const orders =
      await Order.find({
        user: req.userId,
      })
        .populate("items.food")
        .populate(
          "deliveryBoy",
          "name email"
        )
        .sort({
          createdAt: -1,
        });

    res.json({
      orders,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// =====================================================
// GET SHOPKEEPER ORDERS
// =====================================================

const getShopkeeperOrders =
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.userId
        );

      if (
        !user ||
        user.role !==
          "shopkeeper"
      ) {
        return res.status(403).json({
          message:
            "Only shopkeepers can view these orders",
        });
      }

      const orders =
        await Order.find({
          status: {
            $nin: [
              "Delivered",
              "Cancelled",
            ],
          },
        })
          .populate(
            "user",
            "name email"
          )
          .populate(
            "items.food"
          )
          .populate(
            "deliveryBoy",
            "name email"
          )
          .sort({
            createdAt: -1,
          });

      res.json({
        orders,
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };


// =====================================================
// GET SINGLE ORDER
// =====================================================

const getOrderById =
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.orderId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid Order ID",
        });
      }

      const order =
        await Order.findOne({
          _id:
            req.params.orderId,

          user:
            req.userId,
        })
          .select(
            "+deliveryOTP"
          )
          .populate(
            "items.food"
          )
          .populate(
            "deliveryBoy",
            "name email"
          );

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      res.json({
        order,
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };


// =====================================================
// UPDATE ORDER STATUS
// =====================================================

const updateOrderStatus =
  async (req, res) => {
    try {
      const {
        status,
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
        "shopkeeper"
      ) {
        return res.status(403).json({
          message:
            "Only shopkeepers can update order status",
        });
      }

      const allowed = [
        "Pending",
        "Preparing",
        "Ready for Pickup",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ];

      if (
        !allowed.includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid status",
        });
      }

      const order =
        await Order.findById(
          req.params.orderId
        );

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      if (
        status ===
          "Out for Delivery" ||
        status ===
          "Delivered"
      ) {
        return res.status(403).json({
          message:
            "Delivery boy controls delivery status",
        });
      }

      order.status =
        status;

      if (
        status ===
        "Ready for Pickup"
      ) {
        order.deliveryAcceptanceDeadline =
          new Date(
            Date.now() +
              90 * 1000
          );

        order.cancellationReason =
          null;
      }

      await order.save();

      req.io
        .to(
          `order-${order._id}`
        )
        .emit(
          "order-status-updated",
          {
            orderId:
              order._id.toString(),

            status,
          }
        );

      if (
        status ===
        "Ready for Pickup"
      ) {
        const riders =
          await User.find({
            role:
              "deliveryboy",

            isActive:
              true,

            isAvailable:
              true,
          }).select(
            "_id name email"
          );

        riders.forEach(
          (rider) => {
            req.io
              .to(
                `deliveryboy-${rider._id}`
              )
              .emit(
                "new-delivery-request",
                {
                  orderId:
                    order._id.toString(),

                  address:
                    order.address,

                  totalAmount:
                    order.totalAmount,

                  status:
                    order.status,

                  deliveryAcceptanceDeadline:
                    order.deliveryAcceptanceDeadline,
                }
              );
          }
        );
      }

      res.json({
        message:
          "Order status updated",

        order,
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };


// =====================================================
// ACCEPT DELIVERY ORDER
// =====================================================

const acceptDeliveryOrder =
  async (req, res) => {
    try {
      const rider =
        await User.findById(
          req.userId
        );

      if (
        !rider ||
        rider.role !==
          "deliveryboy"
      ) {
        return res.status(403).json({
          message:
            "Only delivery boys can accept orders",
        });
      }

      if (
        !rider.isActive ||
        !rider.isAvailable
      ) {
        return res.status(400).json({
          message:
            "Go online and be available first",
        });
      }

      const order =
        await Order.findById(
          req.params.orderId
        );

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      if (
        order.status !==
        "Ready for Pickup"
      ) {
        return res.status(400).json({
          message:
            "Order is not ready for pickup",
        });
      }

      if (
        order.deliveryAcceptanceDeadline &&
        new Date() >
          order.deliveryAcceptanceDeadline
      ) {
        order.status =
          "Cancelled";

        order.cancellationReason =
          "Delivery boy did not pick up the order within 1 minute 30 seconds.";

        await order.save();

        req.io
          .to(
            `order-${order._id}`
          )
          .emit(
            "order-status-updated",
            {
              orderId:
                order._id.toString(),

              status:
                "Cancelled",

              cancellationReason:
                order.cancellationReason,
            }
          );

        req.io.emit(
          "order-cancelled",
          {
            orderId:
              order._id.toString(),

            status:
              "Cancelled",

            cancellationReason:
              order.cancellationReason,
          }
        );

        return res.status(400).json({
          message:
            "Order has been cancelled because no delivery boy accepted it in time.",
        });
      }

      if (
        order.deliveryBoy
      ) {
        return res.status(409).json({
          message:
            "Order already accepted by another delivery boy",
        });
      }

      order.deliveryBoy =
        rider._id;

      await order.save();

      rider.isAvailable =
        false;

      await rider.save();

      req.io
        .to(
          `order-${order._id}`
        )
        .emit(
          "delivery-boy-assigned",
          {
            orderId:
              order._id.toString(),

            deliveryBoy: {
              id:
                rider._id,

              name:
                rider.name,

              email:
                rider.email,
            },
          }
        );

      req.io.emit(
        "delivery-order-accepted",
        {
          orderId:
            order._id.toString(),

          deliveryBoy: {
            id:
              rider._id,

            name:
              rider.name,

            email:
              rider.email,
          },
        }
      );

      res.json({
        message:
          "Order accepted successfully",

        order,
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };


// =====================================================
// REJECT DELIVERY ORDER
// =====================================================

const rejectDeliveryOrder =
  async (req, res) => {
    res.json({
      message:
        "Order rejected",
    });
  };


// =====================================================
// START DELIVERY
// =====================================================

const startDelivery =
  async (req, res) => {
    try {
      const {
        orderId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          orderId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid Order ID",
        });
      }

      const rider =
        await User.findById(
          req.userId
        );

      if (
        !rider ||
        rider.role !==
          "deliveryboy"
      ) {
        return res.status(403).json({
          message:
            "Only delivery boys can start delivery",
        });
      }

      const order =
        await Order.findById(
          orderId
        ).select(
          "+deliveryOTP"
        );

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      if (
        !order.deliveryBoy ||
        order.deliveryBoy.toString() !==
          req.userId.toString()
      ) {
        return res.status(403).json({
          message:
            "This order is not assigned to you",
        });
      }

      if (
        order.status !==
        "Ready for Pickup"
      ) {
        return res.status(400).json({
          message:
            "Order is not ready for pickup",
        });
      }

      const deliveryOTP =
        Math.floor(
          100000 +
            Math.random() *
              900000
        ).toString();

      order.deliveryOTP =
        deliveryOTP;

      order.deliveryOTPVerified =
        false;

      order.status =
        "Out for Delivery";

      await order.save();

      req.io
        .to(
          `order-${order._id}`
        )
        .emit(
          "order-status-updated",
          {
            orderId:
              order._id.toString(),

            status:
              order.status,
          }
        );

      req.io.emit(
        "delivery-started",
        {
          orderId:
            order._id.toString(),

          status:
            order.status,

          deliveryBoy: {
            id:
              rider._id,

            name:
              rider.name,

            email:
              rider.email,
          },
        }
      );

      res.status(200).json({
        message:
          "Delivery started successfully",

        order: {
          _id:
            order._id,

          status:
            order.status,

          address:
            order.address,

          totalAmount:
            order.totalAmount,
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


// =====================================================
// VERIFY DELIVERY OTP
// =====================================================

const verifyDeliveryOTP =
  async (req, res) => {
    try {
      const {
        orderId,
      } = req.params;

      const {
        otp,
      } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          orderId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid Order ID",
        });
      }

      if (!otp) {
        return res.status(400).json({
          message:
            "Delivery OTP is required",
        });
      }

      const rider =
        await User.findById(
          req.userId
        );

      if (
        !rider ||
        rider.role !==
          "deliveryboy"
      ) {
        return res.status(403).json({
          message:
            "Only delivery boys can verify OTP",
        });
      }

      const order =
        await Order.findById(
          orderId
        ).select(
          "+deliveryOTP"
        );

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      if (
        !order.deliveryBoy ||
        order.deliveryBoy.toString() !==
          req.userId.toString()
      ) {
        return res.status(403).json({
          message:
            "This order is not assigned to you",
        });
      }

      if (
        order.status !==
        "Out for Delivery"
      ) {
        return res.status(400).json({
          message:
            "OTP can only be verified for an order that is out for delivery",
        });
      }

      if (
        order.deliveryOTP !==
        otp.toString().trim()
      ) {
        return res.status(400).json({
          message:
            "Incorrect delivery OTP",
        });
      }

      order.deliveryOTPVerified =
        true;

      order.status =
        "Delivered";

      await order.save();

      rider.isAvailable =
        true;

      await rider.save();

      req.io
        .to(
          `order-${order._id}`
        )
        .emit(
          "order-status-updated",
          {
            orderId:
              order._id.toString(),

            status:
              "Delivered",
          }
        );

      req.io.emit(
        "delivery-completed",
        {
          orderId:
            order._id.toString(),

          status:
            "Delivered",

          deliveryBoy: {
            id:
              rider._id,

            name:
              rider.name,
          },
        }
      );

      res.status(200).json({
        message:
          "OTP verified. Order delivered successfully.",

        order: {
          _id:
            order._id,

          status:
            order.status,

          deliveryOTPVerified:
            true,
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
};