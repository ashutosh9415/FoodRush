import React, {
  useContext,
  useEffect,
  useState,
} from "react";

import { AuthContext } from "../context/AuthContext";
import api from "../utils/api";
import socket from "../utils/socket";

function RiderDashboard() {
  const { user, setUser } =
    useContext(AuthContext);

  const [isOnline, setIsOnline] =
    useState(false);

  const [isAvailable, setIsAvailable] =
    useState(false);

  const [deliveryRequests, setDeliveryRequests] =
    useState([]);

  const [activeOrder, setActiveOrder] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

    const [deliveryOTP, setDeliveryOTP] =
  useState("");
  // =====================================
  // Set current user status
  // =====================================
  useEffect(() => {
    if (user) {
      setIsOnline(
        Boolean(user.isActive)
      );

      setIsAvailable(
        Boolean(user.isAvailable)
      );
    }
  }, [user]);

  // =====================================
  // Join Delivery Boy Room
  // =====================================
  useEffect(() => {
    if (!user?._id && !user?.id) {
      return;
    }

    const deliveryBoyId =
      user._id || user.id;

    socket.emit(
      "join-deliveryboy",
      deliveryBoyId
    );

    console.log(
      "Joined delivery boy room:",
      deliveryBoyId
    );
  }, [user]);

  // =====================================
  // Socket Delivery Requests
  // =====================================
  useEffect(() => {
    const handleNewDeliveryRequest = (
      data
    ) => {
      console.log(
        "New delivery request:",
        data
      );

      setDeliveryRequests(
        (previous) => {
          const alreadyExists =
            previous.some(
              (request) =>
                request.orderId ===
                data.orderId
            );

          if (alreadyExists) {
            return previous;
          }

          return [
            ...previous,
            data,
          ];
        }
      );
    };

    // =====================================
    // Delivery order accepted
    // =====================================
    const handleDeliveryAccepted = (
      data
    ) => {
      console.log(
        "Delivery order accepted:",
        data
      );

      setDeliveryRequests(
        (previous) =>
          previous.filter(
            (request) =>
              request.orderId !==
              data.orderId
          )
      );
    };

    // =====================================
    // Delivery started
    // =====================================
    const handleDeliveryStarted = (
      data
    ) => {
      console.log(
        "Delivery started:",
        data
      );

      if (
        activeOrder?.orderId ===
        data.orderId
      ) {
        setActiveOrder(
          (previous) => ({
            ...previous,
            status:
              "Out for Delivery",
          })
        );
      }
    };

    socket.on(
      "new-delivery-request",
      handleNewDeliveryRequest
    );

    socket.on(
      "delivery-order-accepted",
      handleDeliveryAccepted
    );

    socket.on(
      "delivery-started",
      handleDeliveryStarted
    );

    return () => {
      socket.off(
        "new-delivery-request",
        handleNewDeliveryRequest
      );

      socket.off(
        "delivery-order-accepted",
        handleDeliveryAccepted
      );

      socket.off(
        "delivery-started",
        handleDeliveryStarted
      );
    };
  }, [activeOrder]);

  // =====================================
  // Online / Offline
  // =====================================
  const toggleOnline = async () => {
    try {
      setLoading(true);

      const newStatus =
        !isOnline;

      const response =
        await api.put(
          "/user/availability",
          {
            isActive: newStatus,
            isAvailable: newStatus,
          }
        );

      setIsOnline(
        response.data.user.isActive
      );

      setIsAvailable(
        response.data.user.isAvailable
      );

      setUser(
        response.data.user
      );

      setMessage(
        response.data.message
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data
          ?.message ||
          "Unable to update availability"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // Accept Delivery
  // =====================================
  const acceptDelivery = async (
    orderId
  ) => {
    try {
      setLoading(true);

      const response =
        await api.post(
          `/order/${orderId}/accept`
        );

      const acceptedOrder =
        response.data.order;

      setDeliveryRequests(
        (previous) =>
          previous.filter(
            (request) =>
              request.orderId !==
              orderId
          )
      );

      setActiveOrder({
        orderId:
          acceptedOrder._id,
        status:
          acceptedOrder.status,
        address:
          acceptedOrder.address,
        totalAmount:
          acceptedOrder.totalAmount,
        location:
          acceptedOrder.location,
        items:
          acceptedOrder.items,
      });

      setIsAvailable(false);

      setMessage(
        "Delivery order accepted successfully"
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data
          ?.message ||
          "Unable to accept delivery"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // Reject Delivery
  // =====================================
  const rejectDelivery = async (
    orderId
  ) => {
    try {
      await api.post(
        `/order/${orderId}/reject`
      );

      setDeliveryRequests(
        (previous) =>
          previous.filter(
            (request) =>
              request.orderId !==
              orderId
          )
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data
          ?.message ||
          "Unable to reject request"
      );
    }
  };

  // =====================================
  // Start Delivery
  // =====================================
  const startDelivery = async () => {
    if (!activeOrder) {
      return;
    }

    try {
      setLoading(true);

      const response =
        await api.put(
          `/order/${activeOrder.orderId}/start-delivery`
        );

      setActiveOrder(
        (previous) => ({
          ...previous,
          status:
            response.data.order
              .status,
        })
      );

      setMessage(
        "Delivery started successfully 🚴"
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data
          ?.message ||
          "Unable to start delivery"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
// Verify Delivery OTP
// =====================================
const verifyOTP = async () => {
  if (!activeOrder) {
    return;
  }

  if (
    deliveryOTP.length !== 6
  ) {
    setMessage(
      "Please enter the 6-digit OTP"
    );

    return;
  }

  try {
    setLoading(true);

    const response =
      await api.post(
        `/order/${activeOrder.orderId}/verify-otp`,
        {
          otp: deliveryOTP,
        }
      );

    setActiveOrder(
      (previous) => ({
        ...previous,
        status:
          response.data.order.status,
      })
    );

    setDeliveryOTP("");

    setMessage(
      "OTP verified. Order delivered successfully! 🎉"
    );

    setTimeout(() => {
      setMessage("");
    }, 4000);
  } catch (error) {
    console.error(error);

    setMessage(
      error.response?.data
        ?.message ||
        "Unable to verify OTP"
    );
  } finally {
    setLoading(false);
  }
};

  // =====================================
  // GPS Location Sharing
  // =====================================
  useEffect(() => {
    if (
      !activeOrder ||
      activeOrder.status !==
        "Out for Delivery"
    ) {
      return;
    }

    if (!navigator.geolocation) {
      setMessage(
        "Geolocation is not supported by your browser"
      );

      return;
    }

    const watchId =
      navigator.geolocation.watchPosition(
        (position) => {
          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;

          console.log(
            "Rider location:",
            latitude,
            longitude
          );

          socket.emit(
            "rider-location",
            {
              orderId:
                activeOrder.orderId,
              latitude,
              longitude,
            }
          );
        },
        (error) => {
          console.error(
            "Location error:",
            error
          );
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        }
      );

    return () => {
      navigator.geolocation.clearWatch(
        watchId
      );
    };
  }, [activeOrder]);



  // =====================================
  // Render
  // =====================================
  return (
    <div className="min-h-screen bg-gray-50">

      {/* =================================
          Header
      ================================= */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-6">

          <h1 className="text-3xl font-bold text-gray-800">
            Delivery Boy Dashboard
          </h1>

          <p className="text-gray-500 mt-1">
            Welcome, {user?.name}
          </p>

        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* =================================
            Message
        ================================= */}
        {message && (
          <div className="mb-6 bg-orange-100 border border-orange-300 text-orange-700 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}

        {/* =================================
            Online Status
        ================================= */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div>

              <h2 className="text-xl font-bold text-gray-800">
                Your Availability
              </h2>

              <p className="text-gray-500 mt-1">
                {isOnline
                  ? isAvailable
                    ? "You are online and available for deliveries."
                    : "You are online but currently handling an order."
                  : "You are offline and will not receive delivery requests."}
              </p>

            </div>

            <button
              onClick={toggleOnline}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-semibold text-white ${
                isOnline
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isOnline
                ? "Go Offline"
                : "Go Online"}
            </button>

          </div>

        </div>

        {/* =================================
            Active Delivery
        ================================= */}
        {activeOrder && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">

            <div className="flex items-center justify-between mb-5">

              <h2 className="text-2xl font-bold text-gray-800">
                Active Delivery
              </h2>

              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  activeOrder.status ===
                  "Out for Delivery"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {activeOrder.status}
              </span>

            </div>

            {/* Order ID */}
            <div className="mb-5">

              <p className="text-sm text-gray-500">
                Order ID
              </p>

              <p className="font-bold text-gray-800">
                #
                {activeOrder.orderId
                  .slice(-6)
                  .toUpperCase()}
              </p>

            </div>

            {/* Address */}
            <div className="mb-5">

              <p className="font-semibold text-gray-700">
                Delivery Address
              </p>

              <p className="text-gray-500 mt-1">
                {activeOrder.address}
              </p>

            </div>

            {/* Items */}
            <div className="border-t border-b py-4">

              {activeOrder.items?.map(
                (item, index) => (
                  <div
                    key={index}
                    className="flex justify-between py-2"
                  >

                    <span className="text-gray-700">
                      {item.name} ×{" "}
                      {item.quantity}
                    </span>

                    <span className="font-semibold">
                      ₹
                      {item.price *
                        item.quantity}
                    </span>

                  </div>
                )
              )}

            </div>

            {/* Total */}
            <div className="flex justify-between mt-5">

              <span className="font-bold text-lg">
                Total
              </span>

              <span className="font-bold text-xl text-orange-500">
                ₹{activeOrder.totalAmount}
              </span>

            </div>

            {/* Start Delivery */}
            {activeOrder.status ===
              "Ready for Pickup" && (
              <button
                onClick={startDelivery}
                disabled={loading}
                className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg"
              >
                🚴 Start Delivery
              </button>
            )}

            {/* Out for Delivery */}
{activeOrder.status ===
  "Out for Delivery" && (
  <div className="mt-6">

    {/* GPS Status */}
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">

      <p className="font-semibold text-green-700">
        🚴 You are currently delivering this order
      </p>

      <p className="text-sm text-green-600 mt-1">
        Live location sharing is active.
      </p>

    </div>

    {/* =================================
        Delivery OTP
    ================================= */}
    <div className="mt-6 bg-orange-50 border-2 border-orange-300 rounded-xl p-6">

      <div className="text-center">

        <div className="text-4xl mb-3">
          🔐
        </div>

        <h3 className="text-xl font-bold text-gray-800">
          Enter Customer OTP
        </h3>

        <p className="text-sm text-gray-600 mt-2">
          Ask the customer for the 6-digit delivery OTP.
        </p>

      </div>

      <div className="mt-5">

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={deliveryOTP}
          onChange={(event) => {
            const value =
              event.target.value.replace(
                /\D/g,
                ""
              );

            setDeliveryOTP(value);
          }}
          placeholder="Enter 6-digit OTP"
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] focus:outline-none focus:border-orange-500"
        />

      </div>

      <button
        onClick={verifyOTP}
        disabled={
          loading ||
          deliveryOTP.length !== 6
        }
        className="w-full mt-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg"
      >
        🔐 Verify OTP & Deliver
      </button>

    </div>

  </div>
)}

          </div>
        )}

        {/* =================================
            Delivery Requests
        ================================= */}
        <div>

          <h2 className="text-2xl font-bold text-gray-800 mb-5">
            Delivery Requests
          </h2>

          {deliveryRequests.length ===
          0 ? (
            <div className="bg-white border rounded-xl p-10 text-center">

              <div className="text-5xl mb-4">
                📦
              </div>

              <h3 className="text-xl font-semibold text-gray-700">
                No Delivery Requests
              </h3>

              <p className="text-gray-500 mt-2">
                New orders ready for pickup will appear here.
              </p>

            </div>
          ) : (
            <div className="space-y-5">

              {deliveryRequests.map(
                (request) => (

                  <div
                    key={request.orderId}
                    className="bg-white border rounded-xl shadow-sm p-6"
                  >

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                      <div>

                        <h3 className="text-xl font-bold text-gray-800">
                          Order #
                          {request.orderId
                            .slice(-6)
                            .toUpperCase()}
                        </h3>

                        <p className="text-gray-500 mt-2">
                          {request.address}
                        </p>

                      </div>

                      <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold">
                        Ready for Pickup
                      </span>

                    </div>

                    {/* Items */}
                    <div className="border-t border-b mt-5 py-4">

                      {request.items?.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="flex justify-between py-2"
                          >

                            <span>
                              {item.name} ×{" "}
                              {item.quantity}
                            </span>

                            <span className="font-semibold">
                              ₹
                              {item.price *
                                item.quantity}
                            </span>

                          </div>
                        )
                      )}

                    </div>

                    {/* Total */}
                    <div className="flex justify-between mt-5">

                      <span className="font-bold">
                        Total
                      </span>

                      <span className="font-bold text-orange-500">
                        ₹
                        {
                          request.totalAmount
                        }
                      </span>

                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

                      <button
                        onClick={() =>
                          acceptDelivery(
                            request.orderId
                          )
                        }
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
                      >
                        ✓ Accept Delivery
                      </button>

                      <button
                        onClick={() =>
                          rejectDelivery(
                            request.orderId
                          )
                        }
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg"
                      >
                        ✕ Not Accept
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default RiderDashboard;