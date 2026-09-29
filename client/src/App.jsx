import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Home from
  "./pages/Home";

import Login from
  "./pages/Login";

import Register from
  "./pages/Register";

import Cart from
  "./pages/Cart";

import Orders from
  "./pages/Orders";

import TrackOrder from
  "./pages/TrackOrder";

import RiderDashboard from
  "./pages/RiderDashboard";

import ShopkeeperDashboard from
  "./pages/ShopkeeperDashboard";

import ProtectedRoute from
  "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Client */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute
              allowedRoles={[
                "client",
              ]}
            >
              <Cart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/api/orders"
          element={
            <ProtectedRoute
              allowedRoles={[
                "client",
              ]}
            >
              <Orders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/track-order/:orderId"
          element={
            <ProtectedRoute
              allowedRoles={[
                "client",
              ]}
            >
              <TrackOrder />
            </ProtectedRoute>
          }
        />

        {/* Shopkeeper */}
        <Route
          path="/shopkeeper"
          element={
            <ProtectedRoute
              allowedRoles={[
                "shopkeeper",
              ]}
            >
              <ShopkeeperDashboard />
            </ProtectedRoute>
          }
        />

        {/* Delivery Boy */}
        <Route
          path="/rider"
          element={
            <ProtectedRoute
              allowedRoles={[
                "deliveryboy",
              ]}
            >
              <RiderDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;