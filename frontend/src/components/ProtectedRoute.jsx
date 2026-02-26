import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="w-16 h-16 bg-neutral-200 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their home based on role, or a forbidden page
    // preventing access to unauthorized routes
    return (
      <Navigate
        to={user.role === "provider" ? "/provider" : "/patient"}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
