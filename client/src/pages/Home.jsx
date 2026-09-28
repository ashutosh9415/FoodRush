import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FoodCard from "../components/FoodCard";
import api from "../utils/api";

function Home() {
  // ==========================================
  // FOOD CATEGORIES
  // ==========================================

  const foodCategories = [
    {
      name: "Pizza",
      emoji: "🍕",
      search: "pizza",
    },
    {
      name: "Burger",
      emoji: "🍔",
      search: "burger",
    },
    {
      name: "Paneer",
      emoji: "🥘",
      search: "paneer",
    },
    {
      name: "Biryani",
      emoji: "🍛",
      search: "biryani",
    },
    {
      name: "Cake",
      emoji: "🎂",
      search: "cake",
    },
    {
      name: "Veg Meal",
      emoji: "🍱",
      search: "veg",
    },
  ];

  // ==========================================
  // CUISINE OPTIONS
  // ==========================================

  const cuisines = [
    "North Indian",
    "South Indian",
    "Chinese",
    "Italian",
    "Mughlai",
    "Biryani",
    "Fast Food",
    "Street Food",
    "Desserts",
    "Bakery",
    "Cafe",
    "Punjabi",
    "Continental",
    "Mexican",
    "Rajasthani",
    "Bengali",
  ];

  // ==========================================
  // SEARCH PARAMETER
  // ==========================================

  const [searchParams] = useSearchParams();

  // ==========================================
  // FOOD STATE
  // ==========================================

  const [foods, setFoods] = useState([]);

  const [searchFood, setSearchFood] = useState(
    searchParams.get("search") || ""
  );

  const [shop, setShop] = useState(null);

  // ==========================================
  // LOADING / ERROR
  // ==========================================

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [locationError, setLocationError] = useState("");

  // ==========================================
  // LOCATION POPUP
  // ==========================================

  const [showLocationPopup, setShowLocationPopup] = useState(true);

  // ==========================================
  // MANUAL LOCATION
  // ==========================================

  const [manualLocation, setManualLocation] = useState("");

  const [manualLocationLoading, setManualLocationLoading] =
    useState(false);

  const [manualLocationMessage, setManualLocationMessage] =
    useState("");

  const [currentCity, setCurrentCity] = useState("Your City");

  // ==========================================
  // FILTER STATES
  // ==========================================

  const [showFilters, setShowFilters] = useState(false);

  const [showCuisines, setShowCuisines] = useState(false);

  const [sortBy, setSortBy] = useState("popularity");

  const [selectedCuisine, setSelectedCuisine] = useState("");

  const [selectedRating, setSelectedRating] = useState("");

  const [selectedCost, setSelectedCost] = useState("");

  const [pureVeg, setPureVeg] = useState(false);

  // ==========================================
  // OPEN LOCATION POPUP FROM NAVBAR
  // ==========================================

  useEffect(() => {
    const openLocationPopup = () => {
      setShowLocationPopup(true);
    };

    window.addEventListener(
      "open-location-popup",
      openLocationPopup
    );

    return () => {
      window.removeEventListener(
        "open-location-popup",
        openLocationPopup
      );
    };
  }, []);

  // ==========================================
  // SYNC URL SEARCH WITH SEARCH BOX
  // ==========================================

  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";

    setSearchFood(urlSearch);
  }, [searchParams]);

  // ==========================================
  // FIND NEAREST SHOP AND FOODS
  // ==========================================

  const loadNearestShopFoods = () => {
    setLoading(true);

    setError("");

    setLocationError("");

    setManualLocationMessage("");

    setShop(null);

    setFoods([]);

    // ==========================================
    // CHECK GPS SUPPORT
    // ==========================================

    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by your browser."
      );

      setLoading(false);

      return;
    }

    // ==========================================
    // GET CURRENT LOCATION
    // ==========================================

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;

          const longitude = position.coords.longitude;

          // ==========================================
          // FIND CITY FROM COORDINATES
          // ==========================================

          try {
            const cityResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );

            const cityData = await cityResponse.json();

            const address = cityData.address || {};

            const city =
  address.city ||
  address.town ||
  address.village ||
  address.municipality ||
  address.county ||
  "Your City";

setCurrentCity(city);

localStorage.setItem(
  "foodrush_city",
  city
);

window.dispatchEvent(
  new Event("city-updated")
);
          } catch (cityError) {
            console.error(
              "Current city lookup error:",
              cityError
            );
          }

          console.log(
            "Client location:",
            latitude,
            longitude
          );

          // ==========================================
          // SAVE CLIENT LOCATION
          // ==========================================

          await api.put("/user/location", {
            latitude,
            longitude,
          });

          console.log(
            "Client location saved successfully"
          );

          // ==========================================
          // FIND NEAREST SHOP
          // ==========================================

          const response = await api.get(
            `/food/nearest-shop-foods?latitude=${latitude}&longitude=${longitude}`
          );

          console.log(
            "Nearest shop:",
            response.data.shop
          );

          console.log(
            "Nearest shop foods:",
            response.data.foods
          );

          // ==========================================
          // SAVE SHOP
          // ==========================================

          setShop(response.data.shop || null);

          // ==========================================
          // SAVE FOOD ITEMS
          // ==========================================

          setFoods(response.data.foods || []);
        } catch (error) {
          console.error(
            "Nearest shop foods error:",
            error
          );

          setError(
            error.response?.data?.message ||
              "Unable to load food items."
          );

          setShop(null);

          setFoods([]);
        } finally {
          setLoading(false);
        }
      },

      // ==========================================
      // GPS ERROR
      // ==========================================

      (error) => {
        console.error("Location error:", error);

        let message =
          "Unable to get your location.";

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          message =
            "Location permission was denied. Please allow location access.";
        }

        if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          message =
            "Your current location is unavailable.";
        }

        if (
          error.code ===
          error.TIMEOUT
        ) {
          message =
            "Location request timed out.";
        }

        setLocationError(message);

        setLoading(false);

        setShop(null);

        setFoods([]);
      },

      // ==========================================
      // GPS OPTIONS
      // ==========================================

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // ==========================================
  // USE CURRENT LOCATION
  // ==========================================

  const handleUseCurrentLocation = () => {
    setShowLocationPopup(false);

    setManualLocationMessage("");

    setError("");

    setLocationError("");

    setSearchFood("");

    loadNearestShopFoods();
  };

  // ==========================================
  // MANUAL LOCATION SEARCH
  // ==========================================

  const handleManualLocation = async () => {
    if (!manualLocation.trim()) {
      setManualLocationMessage(
        "Please enter your city or area."
      );

      return;
    }

    try {
      setManualLocationLoading(true);

      setManualLocationMessage("");

      setError("");

      setLocationError("");

      // ==========================================
      // CONVERT LOCATION NAME TO COORDINATES
      // ==========================================

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          manualLocation.trim()
        )}`
      );

      if (!response.ok) {
        throw new Error(
          "Location service is unavailable."
        );
      }

      const data = await response.json();

      // ==========================================
      // LOCATION NOT FOUND
      // ==========================================

      if (!data || data.length === 0) {
        setManualLocationMessage(
          "Location not found. Please try another city or area."
        );

        return;
      }

      const latitude = Number(data[0].lat);

      const longitude = Number(data[0].lon);

      const address = data[0].address || {};

      const city =
  address.city ||
  address.town ||
  address.village ||
  address.municipality ||
  address.county ||
  manualLocation.trim();

setCurrentCity(city);

localStorage.setItem(
  "foodrush_city",
  city
);

window.dispatchEvent(
  new Event("city-updated")
);

      console.log("Manual location:", {
        latitude,
        longitude,
      });

      // ==========================================
      // SAVE CLIENT LOCATION
      // ==========================================

      await api.put("/user/location", {
        latitude,
        longitude,
      });

      console.log(
        "Manual client location saved successfully"
      );

      // ==========================================
      // FIND NEAREST SHOP
      // ==========================================

      const foodResponse = await api.get(
        `/food/nearest-shop-foods?latitude=${latitude}&longitude=${longitude}`
      );

      console.log(
        "Nearest shop:",
        foodResponse.data.shop
      );

      console.log(
        "Nearest shop foods:",
        foodResponse.data.foods
      );

      // ==========================================
      // SAVE SHOP
      // ==========================================

      setShop(foodResponse.data.shop || null);

      // ==========================================
      // SAVE FOODS
      // ==========================================

      setFoods(foodResponse.data.foods || []);

      // ==========================================
      // CLEAR SEARCH
      // ==========================================

      setSearchFood("");

      // ==========================================
      // CLOSE POPUP
      // ==========================================

      setShowLocationPopup(false);

      setManualLocationMessage("");
    } catch (error) {
      console.error(
        "Manual location error:",
        error
      );

      setManualLocationMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to find food for this location."
      );

      setShop(null);

      setFoods([]);
    } finally {
      setManualLocationLoading(false);
    }
  };

  // ==========================================
  // FILTER + SEARCH + SORT FOODS
  // ==========================================

  const filteredFoods = [...foods]
    .filter((food) => {
      const search = searchFood
        .trim()
        .toLowerCase();

      // ==========================================
      // SEARCH FILTER
      // ==========================================

      const matchesSearch =
        !search ||
        food.name
          ?.toLowerCase()
          .includes(search) ||
        food.category
          ?.toLowerCase()
          .includes(search) ||
        food.description
          ?.toLowerCase()
          .includes(search) ||
        food.restaurant
          ?.toLowerCase()
          .includes(search);

      if (!matchesSearch) {
        return false;
      }

      // ==========================================
      // CUISINE FILTER
      // ==========================================

      if (selectedCuisine) {
        const cuisine =
          selectedCuisine.toLowerCase();

        const foodText = `
          ${food.name || ""}
          ${food.category || ""}
          ${food.description || ""}
          ${food.restaurant || ""}
        `.toLowerCase();

        if (!foodText.includes(cuisine)) {
          return false;
        }
      }

      // ==========================================
      // PURE VEG FILTER
      // ==========================================

      if (pureVeg) {
        const foodText = `
          ${food.name || ""}
          ${food.category || ""}
          ${food.description || ""}
          ${food.restaurant || ""}
        `.toLowerCase();

        const nonVegKeywords = [
          "chicken",
          "mutton",
          "fish",
          "egg",
          "prawn",
          "prawns",
          "seafood",
          "meat",
          "non veg",
          "non-veg",
        ];

        const isNonVeg =
          nonVegKeywords.some((keyword) =>
            foodText.includes(keyword)
          );

        if (isNonVeg) {
          return false;
        }
      }

      // ==========================================
      // RATING FILTER
      // ==========================================

      if (selectedRating) {
        const rating = Number(
          food.rating ||
            food.ratings ||
            0
        );

        if (
          rating <
          Number(selectedRating)
        ) {
          return false;
        }
      }

      // ==========================================
      // COST FILTER
      // ==========================================

      const price = Number(food.price || 0);

      if (selectedCost === "under100") {
        if (price > 100) {
          return false;
        }
      }

      if (selectedCost === "100-250") {
        if (price < 100 || price > 250) {
          return false;
        }
      }

      if (selectedCost === "250-500") {
        if (price < 250 || price > 500) {
          return false;
        }
      }

      if (selectedCost === "above500") {
        if (price < 500) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // ==========================================
      // SORT BY RATING
      // ==========================================

      if (sortBy === "rating") {
        return (
          Number(b.rating || 0) -
          Number(a.rating || 0)
        );
      }

      // ==========================================
      // SORT BY COST LOW TO HIGH
      // ==========================================

      if (sortBy === "costLow") {
        return (
          Number(a.price || 0) -
          Number(b.price || 0)
        );
      }

      // ==========================================
      // SORT BY COST HIGH TO LOW
      // ==========================================

      if (sortBy === "costHigh") {
        return (
          Number(b.price || 0) -
          Number(a.price || 0)
        );
      }

      // ==========================================
      // POPULARITY
      // ==========================================

      return 0;
    });

  // ==========================================
  // CHECK WHETHER ANY FILTER IS ACTIVE
  // ==========================================

  const hasActiveFilters =
    sortBy !== "popularity" ||
    selectedCuisine ||
    selectedRating ||
    selectedCost ||
    pureVeg;

  // ==========================================
  // CLEAR ALL FILTERS
  // ==========================================

  const clearAllFilters = () => {
    setSortBy("popularity");

    setSelectedCuisine("");

    setSelectedRating("");

    setSelectedCost("");

    setPureVeg(false);
  };

  // ==========================================
  // RUN LOCATION POPUP WHEN HOME OPENS
  // ==========================================

  useEffect(() => {
    setShowLocationPopup(true);
  }, []);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      <Navbar />

      {/* ==================================================
          LOCATION POPUP
      ================================================== */}

      {showLocationPopup && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-5">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">

            {/* TOP LOCATION SECTION */}

            <div className="px-7 pt-8 pb-5 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-4xl">
                  📍
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-5">
                Find food near you
              </h2>

              <p className="text-gray-500 mt-3 leading-relaxed">
                Allow FoodRush to use your
                location to find the nearest
                open shop and show available
                food.
              </p>
            </div>

            {/* CURRENT LOCATION */}

            <div className="px-7 pb-3">
              <button
                type="button"
                onClick={
                  handleUseCurrentLocation
                }
                className="w-full flex items-center gap-4 border border-gray-200 rounded-2xl p-4 hover:bg-orange-50 hover:border-orange-300 transition"
              >
                <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-xl">
                    📍
                  </span>
                </div>

                <div className="text-left">
                  <p className="font-semibold text-gray-900">
                    Use current location
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Find food available near you
                  </p>
                </div>
              </button>
            </div>

            {/* DIVIDER */}

            <div className="flex items-center gap-3 px-7 py-4">
              <div className="flex-1 h-px bg-gray-200" />

              <span className="text-sm text-gray-400">
                OR
              </span>

              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* MANUAL LOCATION */}

            <div className="px-7 pb-7">
              <p className="font-semibold text-gray-900 mb-3">
                Enter your location
              </p>

              <input
                type="text"
                value={manualLocation}
                onChange={(event) => {
                  setManualLocation(
                    event.target.value
                  );

                  setManualLocationMessage("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleManualLocation();
                  }
                }}
                placeholder="Enter city or area"
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />

              <button
                type="button"
                onClick={
                  handleManualLocation
                }
                disabled={
                  manualLocationLoading
                }
                className="w-full mt-3 bg-orange-500 text-white font-semibold rounded-2xl p-4 hover:bg-orange-600 transition disabled:opacity-50"
              >
                {manualLocationLoading
                  ? "Searching..."
                  : "Search Location"}
              </button>

              <p className="text-xs text-gray-500 text-center mt-3">
                Example: Ghaziabad,
                Uttar Pradesh
              </p>

              {manualLocationMessage && (
                <p className="text-sm text-orange-600 text-center mt-4">
                  {manualLocationMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          FILTER MODAL
      ================================================== */}

      {showFilters && (
        <div
          className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center px-4"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="flex items-center justify-between px-7 py-5 border-b">
              <h2 className="text-2xl font-semibold text-gray-900">
                Filters
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowFilters(false)
                }
                className="text-3xl leading-none text-gray-500 hover:text-gray-900"
              >
                ×
              </button>
            </div>

            {/* FILTER CONTENT */}

            <div className="flex min-h-[430px] max-h-[65vh]">

              {/* LEFT MENU */}

              <div className="hidden sm:block w-52 bg-gray-50 border-r shrink-0">

                <div className="px-6 py-6 border-l-2 border-orange-500 bg-white">
                  <p className="font-semibold text-gray-900">
                    Sort by
                  </p>

                  <p className="text-sm text-orange-500 mt-1">
                    {sortBy ===
                    "popularity"
                      ? "Popularity"
                      : sortBy === "rating"
                      ? "Rating"
                      : sortBy ===
                        "costLow"
                      ? "Cost: Low to High"
                      : "Cost: High to Low"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById(
                        "filter-cuisines"
                      )
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }}
                  className="w-full text-left px-6 py-6 text-gray-700 hover:bg-white transition"
                >
                  Cuisines
                </button>

                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById(
                        "filter-rating"
                      )
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }}
                  className="w-full text-left px-6 py-6 text-gray-700 hover:bg-white transition"
                >
                  Rating
                </button>

                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById(
                        "filter-cost"
                      )
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }}
                  className="w-full text-left px-6 py-6 text-gray-700 hover:bg-white transition"
                >
                  Cost per person
                </button>

              </div>

              {/* RIGHT CONTENT */}

              <div className="flex-1 p-7 overflow-y-auto">

                {/* SORT */}

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-5">
                    Sort by
                  </h3>

                  <div className="space-y-5">

                    {/* POPULARITY */}

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="sort"
                        checked={
                          sortBy ===
                          "popularity"
                        }
                        onChange={() =>
                          setSortBy(
                            "popularity"
                          )
                        }
                        className="w-5 h-5 accent-orange-500"
                      />

                      <span className="text-gray-700">
                        Popularity
                      </span>
                    </label>

                    {/* RATING */}

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="sort"
                        checked={
                          sortBy ===
                          "rating"
                        }
                        onChange={() =>
                          setSortBy("rating")
                        }
                        className="w-5 h-5 accent-orange-500"
                      />

                      <span className="text-gray-700">
                        Rating: High to Low
                      </span>
                    </label>

                    {/* COST LOW */}

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="sort"
                        checked={
                          sortBy ===
                          "costLow"
                        }
                        onChange={() =>
                          setSortBy(
                            "costLow"
                          )
                        }
                        className="w-5 h-5 accent-orange-500"
                      />

                      <span className="text-gray-700">
                        Cost: Low to High
                      </span>
                    </label>

                    {/* COST HIGH */}

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="sort"
                        checked={
                          sortBy ===
                          "costHigh"
                        }
                        onChange={() =>
                          setSortBy(
                            "costHigh"
                          )
                        }
                        className="w-5 h-5 accent-orange-500"
                      />

                      <span className="text-gray-700">
                        Cost: High to Low
                      </span>
                    </label>

                  </div>
                </div>

                {/* CUISINES */}

                <div
                  id="filter-cuisines"
                  className="mb-8 pt-3"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Cuisines
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    {cuisines.map(
                      (cuisine) => (
                        <label
                          key={cuisine}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="filterCuisine"
                            checked={
                              selectedCuisine ===
                              cuisine
                            }
                            onChange={() =>
                              setSelectedCuisine(
                                cuisine
                              )
                            }
                            className="w-4 h-4 accent-orange-500"
                          />

                          <span className="text-gray-700">
                            {cuisine}
                          </span>
                        </label>
                      )
                    )}

                  </div>
                </div>

                {/* RATING */}

                <div
                  id="filter-rating"
                  className="mb-8 pt-3"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Rating
                  </h3>

                  <div className="space-y-3">

                    {["4", "3", "2"].map(
                      (rating) => (
                        <label
                          key={rating}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="filterRating"
                            checked={
                              selectedRating ===
                              rating
                            }
                            onChange={() =>
                              setSelectedRating(
                                rating
                              )
                            }
                            className="w-4 h-4 accent-orange-500"
                          />

                          <span className="text-gray-700">
                            {rating}.0+ ⭐
                          </span>
                        </label>
                      )
                    )}

                  </div>
                </div>

                {/* COST */}

                <div
                  id="filter-cost"
                  className="pt-3"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Cost per person
                  </h3>

                  <div className="space-y-3">

                    {/* UNDER 100 */}

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="filterCost"
                        checked={
                          selectedCost ===
                          "under100"
                        }
                        onChange={() =>
                          setSelectedCost(
                            "under100"
                          )
                        }
                        className="w-4 h-4 accent-orange-500"
                      />

                      <span className="text-gray-700">
                        Under ₹100
                      </span>
                    </label>

                    {/* 100 - 250 */}

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="filterCost"
                        checked={
                          selectedCost ===
                          "100-250"
                        }
                        onChange={() =>
                          setSelectedCost(
                            "100-250"
                          )
                        }
                        className="w-4 h-4 accent-orange-500"
                      />

                      <span className="text-gray-700">
                        ₹100 - ₹250
                      </span>
                    </label>

                    {/* 250 - 500 */}

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="filterCost"
                        checked={
                          selectedCost ===
                          "250-500"
                        }
                        onChange={() =>
                          setSelectedCost(
                            "250-500"
                          )
                        }
                        className="w-4 h-4 accent-orange-500"
                      />

                      <span className="text-gray-700">
                        ₹250 - ₹500
                      </span>
                    </label>

                    {/* ABOVE 500 */}

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="filterCost"
                        checked={
                          selectedCost ===
                          "above500"
                        }
                        onChange={() =>
                          setSelectedCost(
                            "above500"
                          )
                        }
                        className="w-4 h-4 accent-orange-500"
                      />

                      <span className="text-gray-700">
                        ₹500+
                      </span>
                    </label>

                  </div>
                </div>

              </div>
            </div>

            {/* FOOTER */}

            <div className="border-t px-6 py-4 flex items-center justify-between gap-4">

              <p className="text-sm text-gray-500">
                {hasActiveFilters
                  ? "Filters applied"
                  : "No filters selected"}
              </p>

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={
                    clearAllFilters
                  }
                  className="px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                >
                  Clear all
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowFilters(false)
                  }
                  className="px-7 py-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition"
                >
                  Apply
                </button>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================
          MAIN HOME
      ================================================== */}

      <main className="max-w-7xl mx-auto px-6 py-10 pt-28">

        {/* ==================================================
            HERO
        ================================================== */}

        <section className="pt-6 mb-10">

          <div className="mt-6 mb-8 text-left">

            {/* BREADCRUMB */}

            <div className="flex flex-wrap items-center gap-2 text-sm md:text-base text-gray-500">

              <button
                type="button"
                onClick={() =>
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  })
                }
                className="hover:text-orange-500 transition"
              >
                Home
              </button>

              <span>/</span>

              <span>India</span>

              <span>/</span>

              <span className="text-gray-700 font-medium">
                {currentCity}
              </span>

            </div>

            {/* ==================================================
                FILTER BUTTONS
            ================================================== */}

            <div className="flex flex-wrap items-center gap-3 mt-7">

              {/* FILTERS BUTTON */}

              <button
                type="button"
                onClick={() =>
                  setShowFilters(true)
                }
                className={`flex items-center gap-2 px-5 py-3 bg-white border rounded-xl transition shadow-sm ${
                  hasActiveFilters
                    ? "border-orange-500 text-orange-500"
                    : "border-gray-300 text-gray-700 hover:border-orange-500 hover:text-orange-500"
                }`}
              >
                <span className="text-lg">
                  ☷
                </span>

                <span>Filters</span>

                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                )}
              </button>

              {/* PURE VEG */}

              <button
                type="button"
                onClick={() =>
                  setPureVeg(
                    (previous) =>
                      !previous
                  )
                }
                className={`px-5 py-3 bg-white border rounded-xl transition shadow-sm ${
                  pureVeg
                    ? "border-green-500 bg-green-50 text-green-600"
                    : "border-gray-300 text-gray-700 hover:border-green-500 hover:text-green-600"
                }`}
              >
                Pure Veg
              </button>

              {/* CUISINES */}

              <div className="relative">

                <button
                  type="button"
                  onClick={() =>
                    setShowCuisines(
                      (previous) =>
                        !previous
                    )
                  }
                  className={`flex items-center gap-2 px-5 py-3 bg-white border rounded-xl transition shadow-sm ${
                    selectedCuisine
                      ? "border-orange-500 text-orange-500"
                      : "border-gray-300 text-gray-700 hover:border-orange-500 hover:text-orange-500"
                  }`}
                >
                  <span>
                    {selectedCuisine ||
                      "Cuisines"}
                  </span>

                  <span
                    className={`transition ${
                      showCuisines
                        ? "rotate-180"
                        : ""
                    }`}
                  >
                    ⏷
                  </span>
                </button>

                {/* CUISINE DROPDOWN */}

                {showCuisines && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">

                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">
                        Select Cuisine
                      </p>
                    </div>

                    <div className="max-h-80 overflow-y-auto p-2">

                      {/* ALL CUISINES */}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCuisine(
                            ""
                          );

                          setShowCuisines(
                            false
                          );
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-orange-50 transition ${
                          !selectedCuisine
                            ? "bg-orange-50 text-orange-500 font-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        All Cuisines
                      </button>

                      {cuisines.map(
                        (cuisine) => (
                          <button
                            key={cuisine}
                            type="button"
                            onClick={() => {
                              setSelectedCuisine(
                                cuisine
                              );

                              setShowCuisines(
                                false
                              );
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-orange-50 transition ${
                              selectedCuisine ===
                              cuisine
                                ? "bg-orange-50 text-orange-500 font-semibold"
                                : "text-gray-700"
                            }`}
                          >
                            {cuisine}
                          </button>
                        )
                      )}

                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>

          {/* SEARCH INFORMATION */}

          {searchFood && (
            <p className="text-sm text-gray-500 mt-3">
              Searching for{" "}
              <span className="font-semibold text-gray-800">
                "{searchFood}"
              </span>
            </p>
          )}

          {/* ACTIVE FILTER INFORMATION */}

          {(selectedCuisine ||
            pureVeg ||
            selectedRating ||
            selectedCost) && (
            <div className="flex flex-wrap items-center gap-2 mt-4">

              <span className="text-sm text-gray-500">
                Active filters:
              </span>

              {selectedCuisine && (
                <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm">
                  {selectedCuisine}
                </span>
              )}

              {pureVeg && (
                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm">
                  Pure Veg
                </span>
              )}

              {selectedRating && (
                <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm">
                  {selectedRating}.0+ ⭐
                </span>
              )}

              {selectedCost && (
                <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm">
                  {selectedCost ===
                  "under100"
                    ? "Under ₹100"
                    : selectedCost ===
                      "100-250"
                    ? "₹100 - ₹250"
                    : selectedCost ===
                      "250-500"
                    ? "₹250 - ₹500"
                    : "₹500+"}
                </span>
              )}

            </div>
          )}

        </section>

        {/* ==================================================
            FOOD CATEGORIES
        ================================================== */}

        <section className="bg-gray-50 -mx-6 px-6 py-10 mb-12">

          <div className="max-w-7xl mx-auto">

            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Inspiration for your first order
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-6">

              {foodCategories.map(
                (category) => (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => {
                      setSearchFood(
                        category.search
                      );
                    }}
                    className="group text-center"
                  >
                    <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-5xl sm:text-6xl group-hover:scale-105 group-hover:shadow-md transition">
                      {category.emoji}
                    </div>

                    <p className="mt-3 text-base sm:text-lg font-medium text-gray-800">
                      {category.name}
                    </p>
                  </button>
                )
              )}

            </div>
          </div>

        </section>

        {/* ==================================================
            FOOD SECTION
        ================================================== */}

        <section>

          {/* SECTION HEADING */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">

            <div>

              <h2 className="text-3xl font-bold text-gray-900">
                {shop
                  ? `${shop.shopName || shop.name} Foods`
                  : "Food Near You"}
              </h2>

              <p className="text-gray-500 mt-1">
                Discover delicious food
                available near you
              </p>

            </div>

            <button
              type="button"
              onClick={() => {
                setShowLocationPopup(
                  true
                );
              }}
              disabled={loading}
              className="border border-gray-300 bg-white text-gray-700 px-5 py-2.5 rounded-xl hover:border-orange-400 hover:text-orange-500 transition disabled:opacity-50"
            >
              📍 Change Location
            </button>

          </div>

          {/* ==================================================
              LOADING
          ================================================== */}

          {loading && (
            <div className="text-center py-10">

              <div className="text-4xl mb-4">
                📍
              </div>

              <p className="text-lg text-gray-500">
                Finding the nearest shop...
              </p>

              <p className="text-gray-400 mt-2">
                Getting your location and
                available food.
              </p>

            </div>
          )}

          {/* ==================================================
              LOCATION ERROR
          ================================================== */}

          {!loading &&
            locationError && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-5 rounded-xl">

                <p className="font-semibold">
                  {locationError}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setShowLocationPopup(
                      true
                    );
                  }}
                  className="mt-3 bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                  Try Again
                </button>

              </div>
            )}

          {/* ==================================================
              SERVER/API ERROR
          ================================================== */}

          {!loading &&
            !locationError &&
            error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-5 rounded-xl">

                <p className="font-semibold">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setShowLocationPopup(
                      true
                    );
                  }}
                  className="mt-3 bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                  Try Again
                </button>

              </div>
            )}

          {/* ==================================================
              NO SHOP FOUND
          ================================================== */}

          {!loading &&
            !locationError &&
            !error &&
            !shop &&
            !showLocationPopup && (
              <div className="bg-white border rounded-xl p-10 text-center">

                <div className="text-5xl mb-4">
                  🍽️
                </div>

                <p className="text-gray-500 text-lg">
                  No open shop found within
                  10 km of your location.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setShowLocationPopup(
                      true
                    );
                  }}
                  className="mt-4 bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-gray-900"
                >
                  Search Again
                </button>

              </div>
            )}

          {/* ==================================================
              SHOP FOUND BUT NO FOOD
          ================================================== */}

          {!loading &&
            !locationError &&
            !error &&
            shop &&
            foods.length === 0 && (
              <div className="bg-white border rounded-xl p-10 text-center">

                <div className="text-5xl mb-4">
                  🍽️
                </div>

                <p className="text-gray-500 text-lg">
                  {shop.shopName ||
                    shop.name}{" "}
                  currently has no
                  available food items.
                </p>

              </div>
            )}

          {/* ==================================================
              FILTER / SEARCH RESULT - NO FOOD
          ================================================== */}

          {!loading &&
            !locationError &&
            !error &&
            foods.length > 0 &&
            filteredFoods.length === 0 && (
              <div className="bg-white border rounded-xl p-10 text-center">

                <div className="text-5xl mb-4">
                  🔍
                </div>

                <p className="text-gray-600 text-lg">

                  No food found
                  {searchFood
                    ? " for "
                    : " matching your filters"}

                  {searchFood && (
                    <span className="font-semibold text-gray-900">
                      "{searchFood}"
                    </span>
                  )}

                </p>

                <p className="text-gray-400 mt-2">
                  Try another food, cuisine,
                  or clear your filters.
                </p>

                <div className="flex justify-center gap-3 mt-5">

                  {searchFood && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearchFood("")
                      }
                      className="bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600"
                    >
                      Clear Search
                    </button>
                  )}

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={
                        clearAllFilters
                      }
                      className="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-gray-900"
                    >
                      Clear Filters
                    </button>
                  )}

                </div>

              </div>
            )}

          {/* ==================================================
              FOOD ITEMS
          ================================================== */}

          {!loading &&
            !locationError &&
            !error &&
            filteredFoods.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {filteredFoods.map(
                  (food) => (
                    <FoodCard
                      key={food._id}
                      food={food}
                    />
                  )
                )}

              </div>
            )}

        </section>

      </main>

      <Footer />
    </>
  );
}

export default Home;