import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";

import api from "../utils/api";

import socket from "../utils/socket";

function ShopkeeperDashboard() {
  const [foods, setFoods] = useState([]);

  const [orders, setOrders] = useState([]);

  const [currentTime, setCurrentTime] = useState(Date.now());

  // ======================================
// Edit Food
// ======================================

const [editingFood, setEditingFood] = useState(null);

const [editFoodForm, setEditFoodForm] = useState({
  name: "",
  description: "",
  price: "",
  image: "",
  category: "",
  restaurant: "",
});

const [editFoodImageFile, setEditFoodImageFile] =
  useState(null);

const [editFoodLoading, setEditFoodLoading] =
  useState(false);

const [editFoodError, setEditFoodError] =
  useState("");

  // ======================================
  // Timer
  // ======================================
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // ======================================
  // Add Food Form
  // ======================================
  const [foodForm, setFoodForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    category: "",
    restaurant: "",
  });

  // Shopkeeper can use either URL OR upload an image.
  const [foodImageFile, setFoodImageFile] = useState(null);

  const [foodMessage, setFoodMessage] = useState("");

  const [foodError, setFoodError] = useState("");

  const [addingFood, setAddingFood] = useState(false);

  // ======================================
  // Load Foods and Orders
  // ======================================
  const load = async () => {
    try {
      const [
        foodResponse,
        orderResponse,
      ] = await Promise.all([
        // IMPORTANT:
        // Only this shopkeeper's foods
        api.get("/api/food/my-foods"),

        // This shopkeeper's orders
        api.get("/api/order/shopkeeper-orders"),
      ]);

      console.log(
        "MY FOODS RESPONSE:",
        foodResponse.data
      );

      console.log(
        "MY FOODS:",
        foodResponse.data.foods
      );

      setFoods(
        foodResponse.data.foods || []
      );

      const activeOrders =
        (orderResponse.data.orders || []).filter(
          (order) =>
            order.status !== "Cancelled" &&
            order.status !== "Delivered"
        );

      setOrders(activeOrders);
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error.response?.data || error
      );
    }
  };

  // ======================================
  // Initial Load + Socket Events
  // ======================================
  useEffect(() => {
    load();

    // Delivery boy assigned
    const onAssign = (data) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === data.orderId
            ? {
              ...order,
              deliveryBoy:
                data.deliveryBoy,
              deliveryAcceptanceDeadline:
                null,
            }
            : order
        )
      );
    };

    // Delivery order accepted
    const onDeliveryOrderAccepted = (
      data
    ) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === data.orderId
            ? {
              ...order,
              deliveryBoy:
                data.deliveryBoy,
              deliveryAcceptanceDeadline:
                null,
            }
            : order
        )
      );
    };

    // Delivery completed
    const onDeliveryCompleted = (
      data
    ) => {
      setOrders((currentOrders) =>
        currentOrders.filter(
          (order) =>
            order._id !== data.orderId
        )
      );
    };

    // Order cancelled
    const onOrderCancelled = (data) => {
      setOrders((currentOrders) =>
        currentOrders.filter(
          (order) =>
            order._id !== data.orderId
        )
      );
    };

    socket.on(
      "delivery-boy-assigned",
      onAssign
    );

    socket.on(
      "delivery-order-accepted",
      onDeliveryOrderAccepted
    );

    socket.on(
      "delivery-completed",
      onDeliveryCompleted
    );

    socket.on(
      "order-cancelled",
      onOrderCancelled
    );

    return () => {
      socket.off(
        "delivery-boy-assigned",
        onAssign
      );

      socket.off(
        "delivery-order-accepted",
        onDeliveryOrderAccepted
      );

      socket.off(
        "delivery-completed",
        onDeliveryCompleted
      );

      socket.off(
        "order-cancelled",
        onOrderCancelled
      );
    };
  }, []);

  // ======================================
  // Handle Food Input
  // ======================================
  const handleFoodChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFoodForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ======================================
  // Add Food
  // ======================================
  const handleAddFood = async (event) => {
    event.preventDefault();

    setFoodMessage("");
    setFoodError("");

    // User must provide either an image URL or an uploaded image.
    if (!foodForm.image.trim() && !foodImageFile) {
      setFoodError(
        "Please enter a Food Image URL or upload a food image."
      );
      return;
    }

    setAddingFood(true);

    try {
      const formData = new FormData();

      formData.append("name", foodForm.name);
      formData.append(
        "description",
        foodForm.description
      );
      formData.append(
        "price",
        String(Number(foodForm.price))
      );
      formData.append("category", foodForm.category);
      formData.append(
        "restaurant",
        foodForm.restaurant
      );

      // If an image file is selected, send the file.
      // Otherwise send the existing URL.
      if (foodImageFile) {
        formData.append("image", foodImageFile);
      } else {
        formData.append("image", foodForm.image.trim());
      }

      const response = await api.post(
        "/api/food",
        formData
      );

      setFoodMessage(
        response.data.message ||
        "Food item added successfully!"
      );

      setFoodForm({
        name: "",
        description: "",
        price: "",
        image: "",
        category: "",
        restaurant: "",
      });

      setFoodImageFile(null);

      // Reset the file input visually.
      const fileInput =
        document.getElementById(
          "food-image-file"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      await load();
    } catch (error) {
      console.error(error);

      setFoodError(
        error.response?.data?.message ||
        "Failed to add food item"
      );
    } finally {
      setAddingFood(false);
    }
  };

  // ======================================
// Open Edit Food
// ======================================

const handleEditFood = (food) => {
  setEditingFood(food);

  setEditFoodForm({
    name: food.name || "",
    description: food.description || "",
    price: food.price || "",
    image: food.image || "",
    category: food.category || "",
    restaurant: food.restaurant || "",
  });

  setEditFoodImageFile(null);
  setEditFoodError("");
};

// ======================================
// Handle Edit Food Input
// ======================================

const handleEditFoodChange = (event) => {
  const {
    name,
    value,
  } = event.target;

  setEditFoodForm((current) => ({
    ...current,
    [name]: value,
  }));
};

// ======================================
// Update Food
// ======================================

const handleUpdateFood = async (event) => {
  event.preventDefault();

  if (!editingFood) {
    return;
  }

  setEditFoodLoading(true);
  setEditFoodError("");

  try {
    const formData = new FormData();

    formData.append(
      "name",
      editFoodForm.name
    );

    formData.append(
      "description",
      editFoodForm.description
    );

    formData.append(
      "price",
      String(Number(editFoodForm.price))
    );

    formData.append(
      "category",
      editFoodForm.category
    );

    formData.append(
      "restaurant",
      editFoodForm.restaurant
    );

    // New uploaded image
    if (editFoodImageFile) {
      formData.append(
        "image",
        editFoodImageFile
      );
    }

    // Existing/new URL
    else if (editFoodForm.image.trim()) {
      formData.append(
        "image",
        editFoodForm.image.trim()
      );
    }

    const response = await api.put(
      `/api/food/${editingFood._id}`,
      formData
    );

    console.log(
      "Food updated:",
      response.data
    );

    setEditingFood(null);

    setEditFoodImageFile(null);

    setEditFoodForm({
      name: "",
      description: "",
      price: "",
      image: "",
      category: "",
      restaurant: "",
    });

    await load();
  } catch (error) {
    console.error(
      "Update food error:",
      error
    );

    setEditFoodError(
      error.response?.data?.message ||
        "Failed to update food item"
    );
  } finally {
    setEditFoodLoading(false);
  }
};

// ======================================
// Delete Food
// ======================================

const handleDeleteFood = async (foodId) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this food item?"
  );

  if (!confirmed) {
    return;
  }

  try {
    await api.delete(
      `/api/food/${foodId}`
    );

    await load();
  } catch (error) {
    console.error(
      "Delete food error:",
      error
    );

    alert(
      error.response?.data?.message ||
        "Failed to delete food item"
    );
  }
};

  // ======================================
  // Update Order Status
  // ======================================
  const updateStatus = async (
    orderId,
    status
  ) => {
    try {
      await api.put(
        `/api/order/${orderId}/status`,
        {
          status,
        }
      );

      await load();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Update failed"
      );
    }
  };

  // ======================================
  // Statistics
  // ======================================
  const pendingOrders =
    orders.filter(
      (order) =>
        order.status === "Pending"
    ).length;

  // ======================================
  // UI
  // ======================================
  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10 mt-15">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Shopkeeper Dashboard
          </h1>

          <p className="text-gray-500 mt-2">
            Manage your restaurant,
            food items and customer
            orders.
          </p>
        </div>

        {/* Statistics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <p className="text-gray-500">
              Total Food Items
            </p>

            <p className="text-3xl font-bold mt-2">
              {foods.length}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <p className="text-gray-500">
              Total Active Orders
            </p>

            <p className="text-3xl font-bold mt-2">
              {orders.length}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <p className="text-gray-500">
              Pending Orders
            </p>

            <p className="text-3xl font-bold text-orange-500 mt-2">
              {pendingOrders}
            </p>
          </div>

        </section>

        {/* Customer Orders */}
        <section className="mt-10">

          <div className="flex items-center justify-between mb-5">

            <h2 className="text-2xl font-bold">
              Customer Orders
            </h2>

            <button
              onClick={load}
              className="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-gray-900"
            >
              Refresh
            </button>

          </div>

          {!orders.length ? (
            <div className="bg-white border rounded-xl p-10 text-center">

              <div className="text-5xl">
                📦
              </div>

              <h3 className="text-xl font-bold mt-4">
                No Active Orders
              </h3>

              <p className="text-gray-500 mt-2">
                New customer orders will
                appear here.
              </p>

            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order._id}
                className="bg-white border rounded-xl p-5 mb-4 shadow-sm"
              >

                <p className="font-bold text-lg">
                  Order ID:{" "}
                  {order._id}
                </p>

                <p className="mt-2">
                  Customer:{" "}
                  <span className="font-medium">
                    {order.user?.name}
                  </span>
                </p>

                <p className="mt-1">
                  Address:{" "}
                  {order.address}
                </p>

                <p className="mt-1">
                  Total:{" "}
                  <span className="font-bold">
                    ₹{order.totalAmount}
                  </span>
                </p>

                <p className="mt-1">
                  Status:{" "}
                  <span className="font-bold">
                    {order.status}
                  </span>
                </p>

                {/* Pending */}
                {order.status ===
                  "Pending" && (
                    <button
                      onClick={() =>
                        updateStatus(
                          order._id,
                          "Preparing"
                        )
                      }
                      className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg"
                    >
                      Start Preparing
                    </button>
                  )}

                {/* Preparing */}
                {order.status ===
                  "Preparing" && (
                    <button
                      onClick={() =>
                        updateStatus(
                          order._id,
                          "Ready for Pickup"
                        )
                      }
                      className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg"
                    >
                      Ready for Pickup
                    </button>
                  )}

                {/* Ready for Pickup */}
                {order.status ===
                  "Ready for Pickup" && (
                    <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">

                      {order.deliveryBoy ? (
                        <div>

                          <p className="text-green-600 font-semibold text-lg">
                            ✓ Delivery Boy Accepted
                          </p>

                          <p className="mt-2">
                            Delivery Boy:{" "}
                            <span className="font-semibold">
                              {
                                order
                                  .deliveryBoy
                                  .name
                              }
                            </span>
                          </p>

                          {order.deliveryBoy
                            .email && (
                              <p className="mt-1 text-gray-600">
                                Email:{" "}
                                {
                                  order
                                    .deliveryBoy
                                    .email
                                }
                              </p>
                            )}

                          <p className="mt-2 text-green-600 font-medium">
                            Order accepted successfully.
                          </p>

                        </div>
                      ) : (
                        <div>

                          <p className="text-purple-700 font-semibold">
                            🚴 Waiting for Delivery Boy
                          </p>

                          {order.deliveryAcceptanceDeadline && (
                            <p className="mt-2 text-lg font-bold">

                              Time remaining:{" "}

                              {(() => {
                                const remaining =
                                  Math.max(
                                    0,
                                    new Date(
                                      order.deliveryAcceptanceDeadline
                                    ).getTime() -
                                    currentTime
                                  );

                                const minutes =
                                  Math.floor(
                                    remaining /
                                    60000
                                  );

                                const seconds =
                                  Math.floor(
                                    (remaining %
                                      60000) /
                                    1000
                                  );

                                return `${String(
                                  minutes
                                ).padStart(
                                  2,
                                  "0"
                                )}:${String(
                                  seconds
                                ).padStart(
                                  2,
                                  "0"
                                )}`;
                              })()}

                            </p>
                          )}

                          <p className="text-sm text-gray-500 mt-2">
                            A delivery boy must accept this
                            order before the timer expires.
                          </p>

                        </div>
                      )}

                    </div>
                  )}

                {/* Out for Delivery */}
                {order.status ===
                  "Out for Delivery" && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">

                      <p className="text-blue-600 font-semibold">
                        🚚 Out for Delivery
                      </p>

                      {order.deliveryBoy && (
                        <p className="text-gray-600 mt-1">
                          Delivery Boy:{" "}
                          {
                            order
                              .deliveryBoy
                              .name
                          }
                        </p>
                      )}

                    </div>
                  )}

              </div>
            ))
          )}

        </section>

        {/* Food Items */}
        <section className="mt-12">

          <h2 className="text-2xl font-bold mb-5">
            Food Items ({foods.length})
          </h2>

          {!foods.length ? (
            <div className="bg-white border rounded-xl p-10 text-center">

              <p className="text-gray-500">
                No food items available.
              </p>

            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {foods.map((food) => (
                <div
                  key={food._id}
                  className="bg-white border rounded-xl overflow-hidden shadow-sm"
                >

                  <img
                    src={
                      food.image?.startsWith("http")
                        ? food.image
                        : `https://foodrush-1q1y.onrender.com${food.image}`
                    }
                    alt={food.name}
                    className="w-full h-48 object-cover"
                  />

                  <div className="p-5">
  <div className="flex items-start justify-between gap-3">
    <h3 className="text-xl font-bold">
      {food.name}
    </h3>

    <span className="font-bold text-orange-500">
      ₹{food.price}
    </span>
  </div>

  <p className="text-sm text-gray-500 mt-2">
    {food.category}
  </p>

  <p className="text-gray-600 text-sm mt-3">
    {food.description}
  </p>

  <p className="text-sm text-gray-500 mt-3">
    🍽️ {food.restaurant}
  </p>

  {/* ================================= */}
  {/* EDIT + DELETE BUTTONS */}
  {/* ================================= */}

  <div className="flex gap-3 mt-5">
    <button
      type="button"
      onClick={() => handleEditFood(food)}
      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg transition"
    >
      ✏️ Edit
    </button>

    <button
      type="button"
      onClick={() =>
        handleDeleteFood(food._id)
      }
      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg transition"
    >
      🗑️ Delete
    </button>
  </div>
</div>
                </div>
              ))}

            </div>
          )}

        </section>

        {/* Add Food Item */}
        <section className="mt-12 bg-white border rounded-xl p-6 shadow-sm">

          <h2 className="text-2xl font-bold">
            Add Food Item
          </h2>

          <p className="text-gray-500 mt-1 mb-6">
            Add a new food item to your
            restaurant menu.
          </p>

          {/* Success */}
          {foodMessage && (
            <div className="mb-5 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg">
              {foodMessage}
            </div>
          )}

          {/* Error */}
          {foodError && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">
              {foodError}
            </div>
          )}

          <form onSubmit={handleAddFood}>

            {/* Food Name */}
            <div className="mb-4">

              <label className="block font-medium mb-2">
                Food Name
              </label>

              <input
                type="text"
                name="name"
                value={foodForm.name}
                onChange={handleFoodChange}
                placeholder="Example: Chicken Burger"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-orange-500"
                required
              />

            </div>

            {/* Description */}
            <div className="mb-4">

              <label className="block font-medium mb-2">
                Description
              </label>

              <textarea
                name="description"
                value={foodForm.description}
                onChange={handleFoodChange}
                placeholder="Describe the food item"
                rows="4"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-orange-500"
                required
              />

            </div>

            {/* Price + Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="mb-4">

                <label className="block font-medium mb-2">
                  Price (₹)
                </label>

                <input
                  type="number"
                  name="price"
                  value={foodForm.price}
                  onChange={handleFoodChange}
                  placeholder="199"
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-orange-500"
                  required
                />

              </div>

              <div className="mb-4">

                <label className="block font-medium mb-2">
                  Category
                </label>

                <input
                  type="text"
                  name="category"
                  value={foodForm.category}
                  onChange={handleFoodChange}
                  placeholder="Burger"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-orange-500"
                  required
                />

              </div>

            </div>

            {/* Restaurant */}
            <div className="mb-4">

              <label className="block font-medium mb-2">
                Restaurant Name
              </label>

              <input
                type="text"
                name="restaurant"
                value={foodForm.restaurant}
                onChange={handleFoodChange}
                placeholder="FoodRush Restaurant"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-orange-500"
                required
              />

            </div>

            {/* Food Image - URL OR File Upload in ONE INPUT */}
            <div className="mb-6">
              <label className="block font-medium mb-2">
                Food Image
              </label>

              <div className="flex w-full border border-gray-300 rounded-lg overflow-hidden focus-within:border-orange-500">

                {/* URL Input */}
                <input
                  type="text"
                  name="image"
                  value={
                    foodImageFile
                      ? foodImageFile.name
                      : foodForm.image
                  }
                  onChange={(event) => {
                    setFoodImageFile(null);
                    setFoodForm({
                      ...foodForm,
                      image: event.target.value,
                    });
                  }}
                  placeholder="Enter image URL or choose a file"
                  className="flex-1 px-4 py-3 outline-none"
                  readOnly={!!foodImageFile}
                />

                {/* Choose File Button */}
                <label
                  htmlFor="food-image-file"
                  className="bg-orange-500 text-white px-5 py-3 cursor-pointer hover:bg-orange-600 flex items-center"
                >
                  Choose File
                </label>

                <input
                  id="food-image-file"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                      setFoodImageFile(file);
                      setFoodForm({
                        ...foodForm,
                        image: "",
                      });
                    }
                  }}
                />
              </div>

              <p className="text-sm text-gray-500 mt-2">
                Enter an image URL or choose JPG, PNG or WEBP image (maximum 5 MB).
              </p>

              {/* Image Preview */}
              {foodImageFile && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Selected Image:
                  </p>

                  <img
                    src={URL.createObjectURL(foodImageFile)}
                    alt="Food preview"
                    className="w-40 h-40 object-cover rounded-xl border"
                  />
                </div>
              )}

              {/* URL Preview */}
              {!foodImageFile && foodForm.image && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Image Preview:
                  </p>

                  <img
                    src={foodForm.image}
                    alt="Food preview"
                    className="w-40 h-40 object-cover rounded-xl border"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={addingFood}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              {addingFood
                ? "Adding Food..."
                : "Add Food Item"}
            </button>

          </form>

        </section>
        {/* ====================================== */}
{/* EDIT FOOD MODAL */}
{/* ====================================== */}

{editingFood && (
  <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-5 py-10 overflow-y-auto">
    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 my-10">

      {/* Header */}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            Edit Food Item
          </h2>

          <p className="text-gray-500 mt-1">
            Update your food item details.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingFood(null);
            setEditFoodError("");
            setEditFoodImageFile(null);
          }}
          className="text-gray-500 hover:text-red-500 text-3xl"
        >
          ×
        </button>
      </div>

      {/* Error */}

      {editFoodError && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">
          {editFoodError}
        </div>
      )}

      <form onSubmit={handleUpdateFood}>

        {/* Food Name */}

        <div className="mb-4">
          <label className="block font-medium mb-2">
            Food Name
          </label>

          <input
            type="text"
            name="name"
            value={editFoodForm.name}
            onChange={handleEditFoodChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-orange-500"
            required
          />
        </div>

        {/* Description */}

        <div className="mb-4">
          <label className="block font-medium mb-2">
            Description
          </label>

          <textarea
            name="description"
            value={editFoodForm.description}
            onChange={handleEditFoodChange}
            rows="4"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-orange-500"
            required
          />
        </div>

        {/* Price + Category */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="mb-4">
            <label className="block font-medium mb-2">
              Price (₹)
            </label>

            <input
              type="number"
              name="price"
              value={editFoodForm.price}
              onChange={handleEditFoodChange}
              min="1"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-orange-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block font-medium mb-2">
              Category
            </label>

            <input
              type="text"
              name="category"
              value={editFoodForm.category}
              onChange={handleEditFoodChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-orange-500"
              required
            />
          </div>

        </div>

        {/* Restaurant */}

        <div className="mb-4">
          <label className="block font-medium mb-2">
            Restaurant Name
          </label>

          <input
            type="text"
            name="restaurant"
            value={editFoodForm.restaurant}
            onChange={handleEditFoodChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-orange-500"
            required
          />
        </div>

        {/* Image */}

        <div className="mb-6">
          <label className="block font-medium mb-2">
            Food Image
          </label>

          <div className="flex w-full border border-gray-300 rounded-lg overflow-hidden focus-within:border-orange-500">

            <input
              type="text"
              name="image"
              value={
                editFoodImageFile
                  ? editFoodImageFile.name
                  : editFoodForm.image
              }
              onChange={(event) => {
                setEditFoodImageFile(null);

                setEditFoodForm((current) => ({
                  ...current,
                  image: event.target.value,
                }));
              }}
              placeholder="Enter image URL or choose a file"
              className="flex-1 px-4 py-3 outline-none"
              readOnly={!!editFoodImageFile}
            />

            <label
              htmlFor="edit-food-image-file"
              className="bg-orange-500 text-white px-5 py-3 cursor-pointer hover:bg-orange-600 flex items-center"
            >
              Choose File
            </label>

            <input
              id="edit-food-image-file"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file =
                  event.target.files?.[0];

                if (file) {
                  if (
                    file.size >
                    5 * 1024 * 1024
                  ) {
                    setEditFoodError(
                      "Image must be less than 5 MB."
                    );

                    event.target.value = "";
                    return;
                  }

                  setEditFoodError("");
                  setEditFoodImageFile(file);

                  setEditFoodForm((current) => ({
                    ...current,
                    image: "",
                  }));
                }
              }}
            />

          </div>

          <p className="text-sm text-gray-500 mt-2">
            Leave the existing image if you don't want to change it.
          </p>

          {/* New Image Preview */}

          {editFoodImageFile && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                New Image:
              </p>

              <img
                src={URL.createObjectURL(
                  editFoodImageFile
                )}
                alt="New food preview"
                className="w-40 h-40 object-cover rounded-xl border"
              />
            </div>
          )}

          {/* Existing Image Preview */}

          {!editFoodImageFile &&
            editFoodForm.image && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Current Image:
                </p>

                <img
                  src={
                    editFoodForm.image.startsWith(
                      "http"
                    )
                      ? editFoodForm.image
                      : `https://foodrush-1q1y.onrender.com${editFoodForm.image}`
                  }
                  alt="Current food"
                  className="w-40 h-40 object-cover rounded-xl border"
                />
              </div>
            )}
        </div>

        {/* Buttons */}

        <div className="flex gap-3">

          <button
            type="button"
            onClick={() => {
              setEditingFood(null);
              setEditFoodError("");
              setEditFoodImageFile(null);
            }}
            className="flex-1 border border-gray-300 text-gray-700 font-semibold px-5 py-3 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={editFoodLoading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold px-5 py-3 rounded-lg transition"
          >
            {editFoodLoading
              ? "Updating..."
              : "Update Food"}
          </button>

        </div>

      </form>
    </div>
  </div>
)}

      </main>
    </>
  );
}

export default ShopkeeperDashboard;