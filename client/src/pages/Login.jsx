import {
  useContext,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../utils/api";

import {
  AuthContext,
} from "../context/AuthContext";

function Login() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const { setUser } =
    useContext(AuthContext);

  const navigate =
    useNavigate();

  const submit = async (event) => {
    event.preventDefault();

    setError("");

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanPassword =
      password;

    if (!cleanEmail || !cleanPassword) {
      setError(
        "Email and password are required"
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await api.post(
          "/api/user/login",
          {
            email: cleanEmail,
            password: cleanPassword,
          }
        );

      console.log(
        "Login successful:",
        response.data.user
      );

      setUser(
        response.data.user
      );

      if (
        response.data.user.role ===
        "shopkeeper"
      ) {
        navigate("/shopkeeper");
      } else if (
        response.data.user.role ===
        "deliveryboy"
      ) {
        navigate("/rider");
      } else {
        navigate("/");
      }

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Login failed"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

      <form
        onSubmit={submit}
        className="bg-white p-8 rounded-xl shadow w-full max-w-md"
      >

        <h1 className="text-3xl font-bold mb-6">
          Login
        </h1>

        {error && (
          <p className="text-red-500 mb-4">
            {error}
          </p>
        )}

        <input
          className="w-full border p-3 rounded mb-4"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          className="w-full border p-3 rounded mb-4"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 text-white p-3 rounded disabled:opacity-50"
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>

        <p className="mt-4">
          No account?{" "}

          <Link
            className="text-orange-500"
            to="/register"
          >
            Register
          </Link>
        </p>

      </form>

    </div>
  );
}

export default Login;