import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import Navbar from "../components/Navbar";

import api from "../utils/api";

import socket from "../utils/socket";

function Orders() {
  const [
    orders,
    setOrders,
  ] = useState([]);

  const loadOrders = async () => {
    try {
      const response =
        await api.get(
          "/api/order/my-orders"
        );

      setOrders(
        response.data.orders || []
      );
    } catch (error) {
      console.error(
        "Failed to load orders:",
        error
      );
    }
  };

  useEffect(() => {
    loadOrders();

    // Join every existing order room
    const joinOrders = async () => {
      try {
        const response =
          await api.get(
            "/api/order/my-orders"
          );

        const myOrders =
          response.data.orders || [];

        setOrders(myOrders);

        myOrders.forEach(
          (order) => {
            socket.emit(
              "join-order",
              order._id
            );
          }
        );
      } catch (error) {
        console.error(
          error
        );
      }
    };

    joinOrders();

    // Order status changed
    const onStatusUpdate =
      (data) => {
        setOrders(
          (currentOrders) =>
            currentOrders.map(
              (order) =>
                order._id ===
                data.orderId
                  ? {
                      ...order,
                      status:
                        data.status,
                      cancellationReason:
                        data.cancellationReason ||
                        order.cancellationReason,
                    }
                  : order
            )
        );
      };

    // Order cancelled
    const onOrderCancelled =
      (data) => {
        setOrders(
          (currentOrders) =>
            currentOrders.map(
              (order) =>
                order._id ===
                data.orderId
                  ? {
                      ...order,
                      status:
                        "Cancelled",
                      cancellationReason:
                        data.cancellationReason ||
                        "Delivery boy did not pick up the order within 1 minute 30 seconds.",
                    }
                  : order
            )
        );
      };

    socket.on(
      "order-status-updated",
      onStatusUpdate
    );

    socket.on(
      "order-cancelled",
      onOrderCancelled
    );

    return () => {
      socket.off(
        "order-status-updated",
        onStatusUpdate
      );

      socket.off(
        "order-cancelled",
        onOrderCancelled
      );
    };
  }, []);

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">

        <h1 className="text-3xl font-bold mb-6">
          My Orders
        </h1>

        {!orders.length ? (
          <div className="bg-white border rounded-xl p-8 text-center">
            <p className="text-gray-500 text-lg">
              No orders yet.
            </p>
          </div>
        ) : (
          orders.map(
            (order) => (
              <div
                key={order._id}
                className="bg-white border rounded-xl p-5 mb-5 shadow-sm"
              >

                {/* Order ID */}

                <p className="font-bold">
                  Order ID:{" "}
                  {order._id}
                </p>

                {/* Status */}

                <p className="mt-2">
                  Status:{" "}
                  <b>
                    {order.status}
                  </b>
                </p>

                {/* Address */}

                <p className="mt-1">
                  Address:{" "}
                  {order.address}
                </p>

                {/* Total */}

                <p className="mt-1">
                  Total: ₹
                  {
                    order.totalAmount
                  }
                </p>

                {/* ========================= */}
                {/* Waiting for Delivery Boy */}
                {/* ========================= */}

                {order.status ===
                  "Ready for Pickup" && (
                  <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">

                    <p className="font-semibold text-purple-700">
                      🚴 Waiting for Delivery Boy
                    </p>

                    <p className="text-sm text-gray-600 mt-2">
                      Your order is ready.
                      We are finding a
                      delivery boy for you.
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      A delivery boy must
                      accept the order
                      within 1 minute 30
                      seconds.
                    </p>

                  </div>
                )}

                {/* ========================= */}
                {/* Delivery OTP */}
                {/* ========================= */}

                {order.status ===
                  "Out for Delivery" &&
                  order.deliveryOTP && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-5">

                      <h2 className="font-bold text-green-700">
                        🔐 Delivery OTP
                      </h2>

                      <p className="text-3xl font-bold tracking-widest mt-2">
                        {
                          order.deliveryOTP
                        }
                      </p>

                      <p className="mt-2 text-green-700">
                        Share this OTP with
                        the delivery boy when
                        your order arrives.
                      </p>

                    </div>
                  )}

                {/* ========================= */}
                {/* Cancelled */}
                {/* ========================= */}

                {order.status ===
                  "Cancelled" && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-5">

                    <p className="font-bold text-red-600 text-lg">
                      ❌ Order Cancelled
                    </p>

                    <p className="text-red-500 mt-2">
                      {order.cancellationReason ||
                        "Delivery boy did not pick up the order."}
                    </p>

                    <p className="text-gray-600 text-sm mt-2">
                      No delivery boy accepted
                      your order within 1 minute
                      30 seconds.
                    </p>

                  </div>
                )}

                {/* ========================= */}
                {/* Delivered */}
                {/* ========================= */}

                {order.status ===
                  "Delivered" && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">

                    <p className="font-bold text-green-600">
                      ✓ Order Delivered
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                      Your order has been
                      delivered successfully.
                    </p>

                  </div>
                )}

                {/* ========================= */}
                {/* Track Button */}
                {/* ========================= */}

                {order.status !==
                  "Cancelled" && (
                  <Link
                    to={`/track-order/${order._id}`}
                    className="inline-block mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                  >
                    Track Order
                  </Link>
                )}

              </div>
            )
          )
        )}

      </main>
    </>
  );
}

export default Orders;