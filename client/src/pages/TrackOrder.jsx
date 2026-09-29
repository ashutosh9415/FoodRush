import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import Navbar from "../components/Navbar";

import api from "../utils/api";

import socket from "../utils/socket";

const riderIcon =
  new L.Icon({
    iconUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [
      25,
      41,
    ],

    iconAnchor: [
      12,
      41,
    ],
  });

const steps = [
  "Pending",
  "Preparing",
  "Ready for Pickup",
  "Out for Delivery",
  "Delivered",
];

function MapUpdater({ riderLocation }) {
  const map = useMap();

  useEffect(() => {
    if (riderLocation) {
      map.flyTo(riderLocation, 15, {
        duration: 1,
      });
    }
  }, [riderLocation, map]);

  return null;
}

function TrackOrder() {
  const {
    orderId,
  } = useParams();

  const [
    order,
    setOrder,
  ] = useState(null);

  const [
    riderLocation,
    setRiderLocation,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const fetchOrder =
    async () => {
      try {
        const response =
          await api.get(
            `/api/order/${orderId}`
          );

        setOrder(
          response.data.order
        );
      } catch (error) {
        console.error(
          "Failed to fetch order:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchOrder();

    socket.emit(
      "join-order",
      orderId
    );

    // Rider GPS location
    const onLocation =
      (data) => {
        setRiderLocation([
          data.latitude,
          data.longitude,
        ]);
      };

    // Order status changed
    const onStatus =
      async () => {
        await fetchOrder();
      };

    // Order cancelled
    const onCancelled =
      (data) => {
        if (
          data.orderId ===
          orderId
        ) {
          setOrder(
            (currentOrder) =>
              currentOrder
                ? {
                  ...currentOrder,
                  status:
                    "Cancelled",
                  cancellationReason:
                    data.cancellationReason ||
                    "Delivery boy did not pick up the order within 1 minute 30 seconds.",
                }
                : currentOrder
          );
        }
      };

    socket.on(
      "rider-location",
      onLocation
    );

    socket.on(
      "order-status-updated",
      onStatus
    );

    socket.on(
      "order-cancelled",
      onCancelled
    );

    return () => {
      socket.off(
        "rider-location",
        onLocation
      );

      socket.off(
        "order-status-updated",
        onStatus
      );

      socket.off(
        "order-cancelled",
        onCancelled
      );
    };
  }, [orderId]);

  if (loading) {
    return (
      <>
        <Navbar />

        <div className="p-10">
          Loading order...
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />

        <div className="p-10">
          Order not found.
        </div>
      </>
    );
  }

  const customerLocation = [
    order.location.latitude,
    order.location.longitude,
  ];

  const currentStep =
    steps.indexOf(
      order.status
    );

  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">

        <h1 className="text-3xl font-bold">
          Order #{order._id}
        </h1>

        {/* ========================= */}
        {/* Cancelled Order */}
        {/* ========================= */}

        {order.status ===
          "Cancelled" && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">

              <h2 className="text-xl font-bold text-red-600">
                ❌ Order Cancelled
              </h2>

              <p className="mt-2 text-red-500">
                {order.cancellationReason ||
                  "Delivery boy did not pick up the order."}
              </p>

              <p className="mt-2 text-gray-600">
                No delivery boy accepted your
                order within 1 minute 30
                seconds.
              </p>

            </div>
          )}

        {/* ========================= */}
        {/* Normal Order Status */}
        {/* ========================= */}

        {order.status !==
          "Cancelled" && (
            <div className="bg-white border rounded-xl p-5 mt-6">

              <h2 className="text-xl font-bold mb-5">
                Order Status
              </h2>

              <div className="grid grid-cols-5 gap-2">

                {steps.map(
                  (
                    step,
                    index
                  ) => (
                    <div
                      key={step}
                      className="text-center"
                    >

                      <div
                        className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${index <=
                            currentStep
                            ? "bg-orange-500 text-white"
                            : "bg-gray-200 text-gray-500"
                          }`}
                      >
                        {index + 1}
                      </div>

                      <p className="text-xs mt-2">
                        {step}
                      </p>

                    </div>
                  )
                )}

              </div>

            </div>
          )}

        {/* ========================= */}
        {/* Waiting for Delivery Boy */}
        {/* ========================= */}

        {order.status ===
          "Ready for Pickup" && (
            <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-5">

              <h2 className="text-xl font-bold text-purple-700">
                🚴 Waiting for Delivery Boy
              </h2>

              <p className="mt-2 text-gray-600">
                Your order is ready and we are
                finding a delivery boy.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                A delivery boy must accept
                the order within 1 minute 30
                seconds.
              </p>

            </div>
          )}

        {/* ========================= */}
        {/* Delivery OTP */}
        {/* ========================= */}

        {order.status === "Out for Delivery" && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">
                🚴
              </div>

              <div>
                <h2 className="text-xl font-bold text-blue-700">
                  Rider is on the way!
                </h2>

                <p className="mt-2 text-blue-600">
                  Your order is currently out for delivery.
                </p>

                <p className="text-sm text-blue-500 mt-1">
                  You can track the rider's live location on the map below.
                </p>
              </div>
            </div>
          </div>
        )}

        {order.status ===
          "Out for Delivery" &&
          order.deliveryOTP && (

            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">

              <h2 className="text-xl font-bold text-green-700">
                🔐 Delivery OTP
              </h2>

              <p className="text-4xl font-bold tracking-widest mt-3">
                {order.deliveryOTP}
              </p>

              <p className="mt-2 text-green-700">
                Share this OTP with the
                delivery boy when your order
                arrives.
              </p>

            </div>
          )}

        {/* ========================= */}
        {/* Delivered */}
        {/* ========================= */}

        {order.status ===
          "Delivered" && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5">

              <h2 className="text-xl font-bold text-green-700">
                ✓ Order Delivered
              </h2>

              <p className="mt-2 text-gray-600">
                Your order has been delivered
                successfully.
              </p>

            </div>
          )}

        {/* ========================= */}
        {/* Order Details */}
        {/* ========================= */}

        <div className="grid md:grid-cols-2 gap-6 mt-6">

          <div className="bg-white border rounded-xl p-5">

            <h2 className="text-xl font-bold mb-4">
              Order Details
            </h2>

            {order.items.map(
              (item) => (
                <div
                  key={item._id}
                  className="flex justify-between border-b py-3"
                >

                  <span>
                    {item.name} ×{" "}
                    {
                      item.quantity
                    }
                  </span>

                  <span>
                    ₹
                    {Number(
                      item.price
                    ) *
                      item.quantity}
                  </span>

                </div>
              )
            )}

            <p className="font-bold text-lg mt-4">
              Total: ₹
              {
                order.totalAmount
              }
            </p>

            <p className="mt-3">
              <b>
                Address:
              </b>{" "}
              {
                order.address
              }
            </p>

          </div>

          {/* ========================= */}
          {/* Delivery Boy */}
          {/* ========================= */}

          <div className="bg-white border rounded-xl p-5">

            <h2 className="text-xl font-bold mb-4">
              Delivery Boy
            </h2>

            {order.deliveryBoy ? (
              <>
                <p>
                  Name:{" "}
                  {
                    order
                      .deliveryBoy
                      .name
                  }
                </p>

                <p>
                  Email:{" "}
                  {
                    order
                      .deliveryBoy
                      .email
                  }
                </p>
              </>
            ) : (
              <p>
                {order.status ===
                  "Cancelled"
                  ? "No delivery boy accepted this order."
                  : "Waiting for delivery boy..."}
              </p>
            )}

          </div>

        </div>

        {/* ========================= */}
        {/* Live Tracking Map */}
        {/* ========================= */}

        {order.status !==
          "Cancelled" && (
            <div className="mt-6 bg-white border rounded-xl overflow-hidden">

              <div className="p-5">

                <h2 className="text-xl font-bold">
                  Live Delivery Tracking
                </h2>

              </div>

              <MapContainer
                center={
                  riderLocation ||
                  customerLocation
                }
                zoom={15}
                style={{
                  height: "450px",
                  width: "100%",
                }}
              >
                <MapUpdater riderLocation={riderLocation} />

                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker
                  position={
                    customerLocation
                  }
                >
                  <Popup>
                    Delivery Address
                  </Popup>
                </Marker>

                {riderLocation && (
                  <Marker
                    position={
                      riderLocation
                    }
                    icon={
                      riderIcon
                    }
                  >
                    <Popup>
                      Delivery Boy
                    </Popup>
                  </Marker>
                )}

              </MapContainer>

            </div>
          )}

      </main>
    </>
  );
}

export default TrackOrder;