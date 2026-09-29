import {
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../utils/api";

function Navbar() {
  const {
    user,
    setUser,
  } = useContext(AuthContext);

  const {
    cartCount,
  } = useCart();

  const navigate = useNavigate();

  // ==========================================
  // SEARCH
  // ==========================================

  const [search, setSearch] = useState("");

  const [showSearch, setShowSearch] =
    useState(false);

  const searchInputRef = useRef(null);

  // ==========================================
  // CURRENT CITY
  // ==========================================

  const [currentCity, setCurrentCity] =
    useState(
      localStorage.getItem(
        "foodrush_city"
      ) || "Select location"
    );

  // ==========================================
  // USER MENU
  // ==========================================

  const [showUserMenu, setShowUserMenu] =
    useState(false);

  // ==========================================
  // UPDATE CITY FROM HOME
  // ==========================================

  useEffect(() => {
    const updateCity = () => {
      const city =
        localStorage.getItem(
          "foodrush_city"
        );

      if (city) {
        setCurrentCity(city);
      }
    };

    window.addEventListener(
      "city-updated",
      updateCity
    );

    return () => {
      window.removeEventListener(
        "city-updated",
        updateCity
      );
    };
  }, []);

  // ==========================================
  // FOCUS SEARCH INPUT
  // ==========================================

  useEffect(() => {
    if (showSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showSearch]);

  // ==========================================
  // GET USER FIRST LETTER
  // USER ID FIRST LETTER
  // ==========================================

  const getUserInitial = () => {
  const value =
    user?.name ||
    user?.userId ||
    user?.email ||
    "U";

  return String(value)
    .trim()
    .charAt(0)
    .toUpperCase();
};

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    try {
      await api.post("/api/user/logout");
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    }

    setUser(null);
    setShowUserMenu(false);
    navigate("/login");
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const handleSearch = (event) => {
    event.preventDefault();

    const value = search.trim();

    if (!value) {
      return;
    }

    navigate(
      `/?search=${encodeURIComponent(value)}`
    );

    setShowSearch(false);
  };

  // ==========================================
  // OPEN SEARCH
  // ==========================================

  const openSearch = () => {
    setShowSearch(true);
    setShowUserMenu(false);
  };

  // ==========================================
  // CLOSE SEARCH
  // ==========================================

  const closeSearch = () => {
    setShowSearch(false);
    setSearch("");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">

      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-20 flex items-center gap-5">

        {/* ======================================
            LOGO
        ====================================== */}

        <Link
          to="/"
          className="shrink-0"
          onClick={() =>
            setShowUserMenu(false)
          }
        >
          <span className="text-3xl font-black italic tracking-tight text-orange-400">
            FoodRush
          </span>
        </Link>

        {/* ======================================
            LOCATION
        ====================================== */}

        <button
          type="button"
          onClick={() => {
            if (
              window.location.pathname === "/"
            ) {
              window.dispatchEvent(
                new Event(
                  "open-location-popup"
                )
              );
            } else {
              navigate("/");
            }
          }}
          className="hidden md:flex items-center gap-2 text-gray-600 hover:text-orange-500 transition shrink-0"
        >
          <span className="text-xl">
            📍
          </span>

          <span className="max-w-[150px] truncate font-medium">
            {currentCity}
          </span>

          <span className="text-gray-400 text-xs">
            ▼
          </span>
        </button>

        {/* ======================================
            DESKTOP NAVIGATION
        ====================================== */}

        <div className="ml-auto hidden lg:flex items-center gap-6">

          {/* ==================================
              CLIENT
          ================================== */}

          {(!user ||
            user.role === "client") && (
            <>

              {/* ORDERS */}

              {user && (
                <Link
                  to="/api/orders"
                  className="text-gray-600 hover:text-orange-500 transition"
                >
                  Orders
                </Link>
              )}

              {/* SEARCH ICON */}

              <button
                type="button"
                onClick={openSearch}
                className="relative flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition"
                title="Search food"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />

                  <line
                    x1="20"
                    y1="20"
                    x2="16.65"
                    y2="16.65"
                  />
                </svg>
              </button>

              {/* CART */}

              <Link
                to="/cart"
                className="relative flex items-center gap-2 text-gray-600 hover:text-orange-500 transition"
              >
                <span className="text-xl">
                  🛒
                </span>

                <span>
                  Cart
                </span>

                {cartCount > 0 && (
                  <span className="absolute -top-3 -right-4 bg-orange-500 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

            </>
          )}

          {/* ======================================
              SHOPKEEPER
          ====================================== */}

          {user?.role ===
            "shopkeeper" && (
            <Link
              to="/shopkeeper"
              className="text-gray-600 hover:text-orange-500 transition"
            >
              Dashboard
            </Link>
          )}

          {/* ======================================
              DELIVERY BOY
          ====================================== */}

          {user?.role ===
            "deliveryboy" && (
            <Link
              to="/rider"
              className="text-gray-600 hover:text-orange-500 transition"
            >
              Delivery Dashboard
            </Link>
          )}

          {/* ======================================
              DESKTOP USER PROFILE
          ====================================== */}

          {user ? (
            <div className="relative">

              {/* PROFILE CIRCLE */}

              <button
                type="button"
                onClick={() =>
                  setShowUserMenu(
                    (previous) =>
                      !previous
                  )
                }
                className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold text-lg flex items-center justify-center hover:bg-orange-600 transition shadow-sm"
                title="User account"
              >
                {getUserInitial()}
              </button>

              {/* USER DROPDOWN */}

              {showUserMenu && (
                <div className="absolute right-0 top-14 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-[100]">

                  {/* USER INFORMATION */}

                  <div className="px-4 py-3 border-b border-gray-100">

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center shrink-0">
                        {getUserInitial()}
                      </div>

                      <div className="min-w-0">

                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.name ||
                            user.userId ||
                            "User"}
                        </p>

                        {user.email && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {user.email}
                          </p>
                        )}

                      </div>

                    </div>

                  </div>

                  {/* CLIENT ORDERS */}

                  {user.role === "client" && (
                    <Link
                      to="/api/orders"
                      onClick={() =>
                        setShowUserMenu(false)
                      }
                      className="block px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition"
                    >
                      📦 Orders
                    </Link>
                  )}

                  {/* SHOPKEEPER DASHBOARD */}

                  {user.role === "shopkeeper" && (
                    <Link
                      to="/shopkeeper"
                      onClick={() =>
                        setShowUserMenu(false)
                      }
                      className="block px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition"
                    >
                      🏪 Dashboard
                    </Link>
                  )}

                  {/* DELIVERY DASHBOARD */}

                  {user.role === "deliveryboy" && (
                    <Link
                      to="/rider"
                      onClick={() =>
                        setShowUserMenu(false)
                      }
                      className="block px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition"
                    >
                      🚴 Delivery Dashboard
                    </Link>
                  )}

                  {/* LOGOUT */}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-50 border-t border-gray-100 transition"
                  >
                    🚪 Logout
                  </button>

                </div>
              )}

            </div>
          ) : (
            <div className="flex items-center gap-5">

              <Link
                to="/login"
                className="text-gray-700 hover:text-orange-500 transition"
              >
                Log in
              </Link>

              <Link
                to="/register"
                className="text-gray-700 hover:text-orange-500 transition"
              >
                Sign up
              </Link>

            </div>
          )}

        </div>

        {/* ======================================
            PHONE + TABLET ACTIONS
            CART → SEARCH → USER
        ====================================== */}

        <div className="lg:hidden ml-auto flex items-center gap-2">

          {/* ==================================
              CART
          ================================== */}

          {(!user ||
            user.role === "client") && (
            <Link
              to="/cart"
              className="relative flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition"
              title="Cart"
            >
              <span className="text-xl">
                🛒
              </span>

              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* ==================================
              SEARCH
          ================================== */}

          {(!user ||
            user.role === "client") && (
            <button
              type="button"
              onClick={openSearch}
              className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition"
              title="Search food"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />

                <line
                  x1="20"
                  y1="20"
                  x2="16.65"
                  y2="16.65"
                />
              </svg>
            </button>
          )}

          {/* ==================================
              USER
          ================================== */}

          {user ? (
            <div className="relative">

              {/* USER CIRCLE */}

              <button
                type="button"
                onClick={() =>
                  setShowUserMenu(
                    (previous) =>
                      !previous
                  )
                }
                className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold text-lg flex items-center justify-center hover:bg-orange-600 transition shadow-sm"
                title="User account"
              >
                {getUserInitial()}
              </button>

              {/* USER DROPDOWN */}

              {showUserMenu && (
                <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-[100]">

                  {/* USER INFORMATION */}

                  <div className="px-4 py-3 border-b border-gray-100">

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center shrink-0">
                        {getUserInitial()}
                      </div>

                      <div className="min-w-0">

                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.name ||
                            user.userId ||
                            "User"}
                        </p>

                        {user.email && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {user.email}
                          </p>
                        )}

                      </div>

                    </div>

                  </div>

                  {/* CLIENT ORDERS */}

                  {user.role === "client" && (
                    <Link
                      to="/api/orders"
                      onClick={() =>
                        setShowUserMenu(false)
                      }
                      className="block px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition"
                    >
                      📦 Orders
                    </Link>
                  )}

                  {/* SHOPKEEPER DASHBOARD */}

                  {user.role === "shopkeeper" && (
                    <Link
                      to="/shopkeeper"
                      onClick={() =>
                        setShowUserMenu(false)
                      }
                      className="block px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition"
                    >
                      🏪 Dashboard
                    </Link>
                  )}

                  {/* DELIVERY DASHBOARD */}

                  {user.role === "deliveryboy" && (
                    <Link
                      to="/rider"
                      onClick={() =>
                        setShowUserMenu(false)
                      }
                      className="block px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition"
                    >
                      🚴 Delivery Dashboard
                    </Link>
                  )}

                  {/* LOGOUT */}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-50 border-t border-gray-100 transition"
                  >
                    🚪 Logout
                  </button>

                </div>
              )}

            </div>
          ) : (
            /* NOT LOGGED IN */

            <Link
              to="/login"
              className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-orange-50 hover:text-orange-500 transition"
              title="Login"
            >
              👤
            </Link>
          )}

        </div>

      </div>

      {/* ==========================================
          SEARCH OVERLAY / SEARCH BOX
      ========================================== */}

      {showSearch && (
        <div className="absolute top-20 left-0 right-0 bg-white border-t border-gray-100 border-b border-gray-200 shadow-lg">

          <div className="max-w-3xl mx-auto px-5 py-5">

            <form
              onSubmit={handleSearch}
              className="flex items-center gap-3"
            >

              {/* SEARCH INPUT */}

              <div className="relative flex-1">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>

                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search for restaurant, cuisine or a dish"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-5 py-3.5 outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                />

              </div>

              {/* SEARCH BUTTON */}

              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3.5 rounded-xl transition"
              >
                Search
              </button>

              {/* CLOSE BUTTON */}

              <button
                type="button"
                onClick={closeSearch}
                className="w-11 h-11 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 transition flex items-center justify-center"
                title="Close search"
              >
                ✕
              </button>

            </form>

            {/* SEARCH SUGGESTIONS */}

            <div className="flex flex-wrap gap-2 mt-4">

              <span className="text-sm text-gray-500 mr-2 py-2">
                Popular:
              </span>

              {/* PIZZA */}

              <button
                type="button"
                onClick={() => {
                  setSearch("Pizza");

                  navigate(
                    "/?search=Pizza"
                  );

                  setShowSearch(false);
                }}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500 transition"
              >
                🍕 Pizza
              </button>

              {/* BURGER */}

              <button
                type="button"
                onClick={() => {
                  setSearch("Burger");

                  navigate(
                    "/?search=Burger"
                  );

                  setShowSearch(false);
                }}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500 transition"
              >
                🍔 Burger
              </button>

              {/* PASTA */}

              <button
                type="button"
                onClick={() => {
                  setSearch("Pasta");

                  navigate(
                    "/?search=Pasta"
                  );

                  setShowSearch(false);
                }}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500 transition"
              >
                🍝 Pasta
              </button>

              {/* BIRYANI */}

              <button
                type="button"
                onClick={() => {
                  setSearch("Biryani");

                  navigate(
                    "/?search=Biryani"
                  );

                  setShowSearch(false);
                }}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500 transition"
              >
                🍛 Biryani
              </button>

            </div>

          </div>

        </div>
      )}

    </nav>
  );
}

export default Navbar;