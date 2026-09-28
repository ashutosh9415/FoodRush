import React, { useContext } from "react";
import { Navigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useContext(AuthContext);

  // Wait until current user check is completed
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-semibold text-gray-700">
          Loading...
        </p>
      </div>
    );
  }

  // User is not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if allowedRoles is provided
  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    // Redirect user to their correct page
    if (user.role === "shopkeeper") {
      return <Navigate to="/shopkeeper" replace />;
    }

    if (user.role === "deliveryboy") {
      return <Navigate to="/rider" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;