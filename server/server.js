const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

const dotenv = require("dotenv");

dotenv.config();

const express = require("express");

const cors = require("cors");

const cookieParser = require("cookie-parser");

const http = require("http");

const Order = require("./models/Order");

const { Server } = require("socket.io");

const connectDB = require("./config/db");

const userRoutes = require("./routes/UserRoutes");

const foodRoutes = require("./routes/FoodRoutes");

const orderRoutes = require("./routes/OrderRoutes");

const app = express();

const server = http.createServer(app);

// ======================================
// Allowed Frontend Origins
// ======================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",

  // Current Vercel frontend
  "https://foodrush-client.vercel.app",

  // Older Vercel deployments
  "https://foodrush-client-git-main-vashutosh236-1764s-projects.vercel.app",

  "https://foodrush-client-kajn3sp44-vashutosh236-1764s-projects.vercel.app",
];

// ======================================
// Socket.IO
// ======================================

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// ======================================
// Database
// ======================================

connectDB();

// ======================================
// Middleware
// ======================================

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser());

// ======================================
// Uploaded Images
// ======================================

app.use(
  "/uploads",
  express.static("uploads")
);

// ======================================
// Make Socket.IO available in controllers
// ======================================

app.use((req, res, next) => {
  req.io = io;
  next();
});

// ======================================
// Test Route
// ======================================

app.get("/", (req, res) => {
  res.send("FoodRush Server is running");
});

// ======================================
// API Routes
// ======================================

app.use(
  "/api/user",
  userRoutes
);

app.use(
  "/api/food",
  foodRoutes
);

app.use(
  "/api/order",
  orderRoutes
);

// ======================================
// Socket.IO Events
// ======================================

io.on("connection", (socket) => {
  console.log(
    "User connected:",
    socket.id
  );

  // ====================================
  // Customer joins order room
  // ====================================

  socket.on("join-order", (orderId) => {
    if (!orderId) {
      return;
    }

    socket.join(
      `order-${orderId}`
    );

    console.log(
      `Socket ${socket.id} joined order-${orderId}`
    );
  });

  // ====================================
  // Delivery boy joins personal room
  // ====================================

  socket.on(
    "join-deliveryboy",
    (deliveryBoyId) => {
      if (!deliveryBoyId) {
        return;
      }

      socket.join(
        `deliveryboy-${deliveryBoyId}`
      );

      console.log(
        `Delivery boy ${deliveryBoyId} joined personal room`
      );
    }
  );

  // ====================================
  // Rider sends live GPS
  // ====================================

  socket.on(
    "rider-location",
    (data) => {
      const {
        orderId,
        latitude,
        longitude,
      } = data;

      if (
        !orderId ||
        typeof latitude !== "number" ||
        typeof longitude !== "number"
      ) {
        return;
      }

      io.to(
        `order-${orderId}`
      ).emit(
        "rider-location",
        {
          latitude,
          longitude,
        }
      );
    }
  );

  // ====================================
  // Disconnect
  // ====================================

  socket.on(
    "disconnect",
    () => {
      console.log(
        "User disconnected:",
        socket.id
      );
    }
  );
});

// ======================================
// Server Port
// ======================================

const PORT =
  process.env.PORT || 5000;

// ======================================
// Cancel Orders Not Accepted Within
// 90 Seconds
// ======================================

setInterval(async () => {
  try {
    const expiredOrders =
      await Order.find({
        status:
          "Ready for Pickup",

        deliveryBoy: null,

        deliveryAcceptanceDeadline: {
          $lte: new Date(),
        },
      });

    for (
      const order of expiredOrders
    ) {
      order.status =
        "Cancelled";

      order.cancellationReason =
        "Delivery boy did not pick up the order within 1 minute 30 seconds.";

      await order.save();

      // Notify customer in order room

      io.to(
        `order-${order._id}`
      ).emit(
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

      // Notify all connected clients

      io.emit(
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

      console.log(
        `Order ${order._id} cancelled: no delivery boy accepted it`
      );
    }
  } catch (error) {
    console.error(
      "Order expiry checker error:",
      error.message
    );
  }
}, 5000);

// ======================================
// Start Server
// ======================================

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
  }
);