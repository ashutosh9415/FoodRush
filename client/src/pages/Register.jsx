import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../utils/api";

function Register() {
  // ======================================
  // Common User Fields
  // ======================================

  const [
    name,
    setName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    role,
    setRole,
  ] = useState("client");

  // ======================================
  // Shopkeeper Fields
  // ======================================

  const [
    shopName,
    setShopName,
  ] = useState("");

  const [
    shopAddress,
    setShopAddress,
  ] = useState("");

  const [
    shopPhone,
    setShopPhone,
  ] = useState("");

  const [
    shopDescription,
    setShopDescription,
  ] = useState("");

  const [
    shopImage,
    setShopImage,
  ] = useState("");

  const [
    latitude,
    setLatitude,
  ] = useState("");

  const [
    longitude,
    setLongitude,
  ] = useState("");

  const [
    locationLoading,
    setLocationLoading,
  ] = useState(false);

  // ======================================
  // Error / Loading
  // ======================================

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const navigate =
    useNavigate();

  // ======================================
  // Get Restaurant Location
  // ======================================

  const getRestaurantLocation =
    () => {
      setError("");

      if (
        !navigator.geolocation
      ) {
        setError(
          "Geolocation is not supported by your browser"
        );

        return;
      }

      setLocationLoading(
        true
      );

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(
            position.coords.latitude
          );

          setLongitude(
            position.coords.longitude
          );

          setLocationLoading(
            false
          );
        },

        (locationError) => {
          console.error(
            "Location error:",
            locationError
          );

          setLocationLoading(
            false
          );

          setError(
            "Unable to get location. Please allow location access."
          );
        },

        {
          enableHighAccuracy: true,

          timeout: 10000,

          maximumAge: 0,
        }
      );
    };

  // ======================================
  // Submit Registration
  // ======================================

  const submit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    // ======================================
    // Basic Validation
    // ======================================

    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password
    ) {
      setError(
        "Name, email, mobile number and password are required"
      );

      return;
    }

    // ======================================
    // Phone Validation
    // ======================================

    if (
      !/^[0-9]{10}$/.test(
        phone.trim()
      )
    ) {
      setError(
        "Mobile number must contain exactly 10 digits"
      );

      return;
    }

    // ======================================
    // Shopkeeper Validation
    // ======================================

    if (
      role ===
      "shopkeeper"
    ) {
      if (
        !shopName.trim() ||
        !shopAddress.trim() ||
        !shopPhone.trim() ||
        !shopDescription.trim()
      ) {
        setError(
          "Please fill all restaurant details"
        );

        return;
      }

      if (
        !/^[0-9]{10}$/.test(
          shopPhone.trim()
        )
      ) {
        setError(
          "Restaurant phone number must contain exactly 10 digits"
        );

        return;
      }

      if (
        latitude === "" ||
        longitude === ""
      ) {
        setError(
          "Please get your restaurant location"
        );

        return;
      }
    }

    try {
      setLoading(true);

      // ======================================
      // Common Registration Data
      // ======================================

      const userData = {
        name: name.trim(),

        email: email
          .trim()
          .toLowerCase(),

        phone: phone.trim(),

        password,

        role,
      };

      // ======================================
      // Shopkeeper Registration Data
      // ======================================

      if (
        role ===
        "shopkeeper"
      ) {
        userData.shopName =
          shopName.trim();

        userData.shopAddress =
          shopAddress.trim();

        userData.shopPhone =
          shopPhone.trim();

        userData.shopDescription =
          shopDescription.trim();

        userData.shopImage =
          shopImage.trim();

        userData.latitude =
          Number(latitude);

        userData.longitude =
          Number(longitude);
      }

      // ======================================
      // Send Registration Request
      // ======================================

      await api.post(
        "/api/user/register",
        userData
      );

      // ======================================
      // Registration Successful
      // ======================================

      navigate("/login");
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setError(
        error.response
          ?.data
          ?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10 px-4">

      <form
        onSubmit={submit}
        className="bg-white p-8 rounded-xl shadow w-full max-w-md"
      >

        {/* ======================================
            Heading
        ====================================== */}

        <h1 className="text-3xl font-bold mb-6">
          Register
        </h1>

        {/* ======================================
            Error
        ====================================== */}

        {error && (
          <p className="text-red-500 mb-4 bg-red-50 p-3 rounded">
            {error}
          </p>
        )}

        {/* ======================================
            Name
        ====================================== */}

        <input
          className="w-full border p-3 rounded mb-4"
          placeholder="Full Name"
          value={name}
          onChange={(e) =>
            setName(
              e.target.value
            )
          }
        />

        {/* ======================================
            Email
        ====================================== */}

        <input
          className="w-full border p-3 rounded mb-4"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
        />

        {/* ======================================
            Mobile Number
        ====================================== */}

        <input
          className="w-full border p-3 rounded mb-4"
          type="tel"
          placeholder="Mobile Number"
          value={phone}
          maxLength={10}
          onChange={(e) =>
            setPhone(
              e.target.value.replace(
                /\D/g,
                ""
              )
            )
          }
        />

        {/* ======================================
            Password
        ====================================== */}

        <input
          className="w-full border p-3 rounded mb-4"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
        />

        {/* ======================================
            Role Selection
        ====================================== */}

        <div className="space-y-2 mb-5">

          <p className="font-semibold mb-2">
            Register as:
          </p>

          <label className="block">
            <input
              type="radio"
              checked={
                role ===
                "client"
              }
              onChange={() =>
                setRole(
                  "client"
                )
              }
            />{" "}
            Client
          </label>

          <label className="block">
            <input
              type="radio"
              checked={
                role ===
                "shopkeeper"
              }
              onChange={() =>
                setRole(
                  "shopkeeper"
                )
              }
            />{" "}
            Shopkeeper
          </label>

          <label className="block">
            <input
              type="radio"
              checked={
                role ===
                "deliveryboy"
              }
              onChange={() =>
                setRole(
                  "deliveryboy"
                )
              }
            />{" "}
            Delivery Boy
          </label>

        </div>

        {/* ======================================
            SHOPKEEPER SECTION
        ====================================== */}

        {role ===
          "shopkeeper" && (
          <div className="border-t pt-5 mb-5">

            <h2 className="text-xl font-bold mb-4">
              Restaurant Details
            </h2>

            {/* Shop Name */}

            <input
              className="w-full border p-3 rounded mb-4"
              placeholder="Restaurant Name"
              value={shopName}
              onChange={(e) =>
                setShopName(
                  e.target.value
                )
              }
            />

            {/* Shop Address */}

            <textarea
              className="w-full border p-3 rounded mb-4"
              placeholder="Restaurant Address"
              rows="3"
              value={
                shopAddress
              }
              onChange={(e) =>
                setShopAddress(
                  e.target.value
                )
              }
            />

            {/* Shop Phone */}

            <input
              className="w-full border p-3 rounded mb-4"
              type="tel"
              placeholder="Restaurant Phone Number"
              value={
                shopPhone
              }
              maxLength={10}
              onChange={(e) =>
                setShopPhone(
                  e.target.value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
            />

            {/* Shop Description */}

            <textarea
              className="w-full border p-3 rounded mb-4"
              placeholder="Restaurant Description"
              rows="3"
              value={
                shopDescription
              }
              onChange={(e) =>
                setShopDescription(
                  e.target.value
                )
              }
            />

            {/* Shop Image */}

            <input
              className="w-full border p-3 rounded mb-4"
              placeholder="Restaurant Image URL (optional)"
              value={
                shopImage
              }
              onChange={(e) =>
                setShopImage(
                  e.target.value
                )
              }
            />

            {/* ======================================
                Restaurant Location
            ====================================== */}

            <div className="mb-4">

              <p className="font-semibold mb-2">
                Restaurant Location
              </p>

              <button
                type="button"
                onClick={
                  getRestaurantLocation
                }
                disabled={
                  locationLoading
                }
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white p-3 rounded mb-3"
              >
                {locationLoading
                  ? "Getting Location..."
                  : "📍 Get Restaurant Location"}
              </button>

              {latitude !==
                "" &&
                longitude !==
                  "" && (
                  <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">

                    <p className="text-green-700 font-semibold">
                      ✓ Location detected
                    </p>

                    <p>
                      Latitude:{" "}
                      {latitude}
                    </p>

                    <p>
                      Longitude:{" "}
                      {longitude}
                    </p>

                  </div>
                )}

            </div>

          </div>
        )}

        {/* ======================================
            Register Button
        ====================================== */}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white p-3 rounded"
        >
          {loading
            ? "Registering..."
            : "Register"}
        </button>

        {/* ======================================
            Login
        ====================================== */}

        <p className="mt-4">
          Already registered?{" "}

          <Link
            className="text-orange-500"
            to="/login"
          >
            Login
          </Link>
        </p>

      </form>

    </div>
  );
}

export default Register;