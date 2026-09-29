import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import api from "../utils/api";

function Cart() {
  const {
    cart,
    cartTotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [address, setAddress] = useState("");
  const [location, setLocation] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const getLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setLocation(loc);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.latitude}&lon=${loc.longitude}`
          );

          const data = await response.json();

          setAddress(data.display_name || "");
        } catch (error) {
          console.error(
            "Address lookup failed:",
            error
          );
        }
      },
      () => {
        setError(
          "Location permission is required."
        );
      }
    );
  };

  const placeOrder = async () => {
    setError("");

    if (!cart.length) {
      setError("Cart is empty");
      return;
    }

    if (!address.trim()) {
      setError("Please enter your address");
      return;
    }

    if (!location) {
      setError("Please get your live location");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/api/order", {
        items: cart.map((item) => ({
          food: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount: cartTotal,
        address,
        location,
        paymentMethod,
      });

      if (paymentMethod === "COD") {
        clearCart();
        navigate("/api/orders");
        return;
      }

      const orderId = response.data.order._id;

const razorpayKeyId =
  response.data.razorpay.key;

const razorpayOrderId =
  response.data.razorpay.orderId;

const amount =
  response.data.razorpay.amount;

const currency =
  response.data.razorpay.currency;

      if (!razorpayKeyId || !razorpayOrderId) {
        setError(
          "Online payment could not be started."
        );
        return;
      }

      if (!window.Razorpay) {
        setError(
          "Razorpay Checkout is not loaded. Please refresh the page."
        );
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        name: "FoodRush",
        description: "FoodRush Order",
        order_id: razorpayOrderId,

        handler: async function (paymentResponse) {
          try {
            await api.post(
              "/api/order/verify-payment",
              {
                orderId,
                razorpayOrderId:
                  paymentResponse.razorpay_order_id,
                razorpayPaymentId:
                  paymentResponse.razorpay_payment_id,
                razorpaySignature:
                  paymentResponse.razorpay_signature,
              }
            );

            clearCart();
            navigate("/api/orders");
          } catch (error) {
            setError(
              error.response?.data?.message ||
                "Payment verification failed."
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: function () {
            setLoading(false);
            setError(
              "Payment was cancelled."
            );
          },
        },

        prefill: {
          name: "",
          email: "",
          contact: "",
        },

        theme: {
          color: "#f97316",
        },
      };

      const razorpay = new window.Razorpay(
        options
      );

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "Payment failed:",
            response.error
          );

          setLoading(false);

          setError(
            response.error?.description ||
              "Payment failed. Please try again."
          );
        }
      );

      razorpay.open();
    } catch (error) {
      console.error(
        "Order/payment error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Could not place order"
      );

      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10 pt-28">
        <h1 className="text-3xl font-bold mb-6">
          Your Cart
        </h1>

        {!cart.length ? (
          <div className="bg-white border rounded-xl p-8 text-center">
            <p className="text-gray-500">
              Cart is empty.
            </p>
          </div>
        ) : (
          <>
            {cart.map((item) => (
              <div
                key={item._id}
                className="bg-white border rounded-xl p-4 mb-3 flex justify-between items-center"
              >
                <div>
                  <b className="text-lg">
                    {item.name}
                  </b>

                  <p className="text-gray-600">
                    ₹{item.price}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      decreaseQuantity(
                        item._id
                      )
                    }
                    className="border px-3 py-1 rounded"
                  >
                    −
                  </button>

                  <span className="font-semibold">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      increaseQuantity(
                        item._id
                      )
                    }
                    className="border px-3 py-1 rounded"
                  >
                    +
                  </button>

                  <button
                    onClick={() =>
                      removeFromCart(
                        item._id
                      )
                    }
                    className="text-red-500 ml-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <textarea
              className="w-full border rounded-xl p-3 mt-6"
              rows="3"
              placeholder="Delivery address"
              value={address}
              onChange={(event) =>
                setAddress(event.target.value)
              }
            />

            <button
              onClick={getLocation}
              className="mt-3 border px-4 py-2 rounded-lg hover:bg-gray-100"
            >
              📍 Use Current Location
            </button>

            {location && (
              <p className="text-green-600 mt-2">
                ✓ Location captured
              </p>
            )}

            {/* Payment Method */}
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-3">
                Payment Method
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <label
                  className={`border rounded-xl p-4 cursor-pointer transition ${
                    paymentMethod === "COD"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={
                        paymentMethod === "COD"
                      }
                      onChange={() =>
                        setPaymentMethod("COD")
                      }
                    />

                    <div>
                      <p className="font-semibold">
                        Cash on Delivery
                      </p>

                      <p className="text-sm text-gray-500">
                        Pay when your order arrives
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`border rounded-xl p-4 cursor-pointer transition ${
                    paymentMethod === "ONLINE"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ONLINE"
                      checked={
                        paymentMethod === "ONLINE"
                      }
                      onChange={() =>
                        setPaymentMethod(
                          "ONLINE"
                        )
                      }
                    />

                    <div>
                      <p className="font-semibold">
                        Online Payment
                      </p>

                      <p className="text-sm text-gray-500">
                        UPI, Card, Net Banking and more
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <p className="text-red-500 mt-4">
                {error}
              </p>
            )}

            <div className="mt-6 text-right">
              <h2 className="text-2xl font-bold">
                Total: ₹{cartTotal}
              </h2>

              <button
                onClick={placeOrder}
                disabled={loading}
                className="mt-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold"
              >
                {loading
                  ? "Processing..."
                  : paymentMethod === "COD"
                  ? "Place Order"
                  : "Pay Online"}
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}

export default Cart;