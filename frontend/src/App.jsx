/**
 * ART Adherence Tracking System - Main Application Component
 *
 * This is the root React component that sets up the entire ART medication adherence application.
 * It provides routing, authentication, theming, and service worker registration for a progressive web app.
 *
 * Key Features Implemented:
 * - Role-based routing (patient, provider, admin)
 * - Protected routes with authentication
 * - Dark/light theme support
 * - Service worker for offline functionality
 * - Toast notifications
 * - Responsive layout with different interfaces per role
 *
 * Architecture:
 * - Uses React Router for client-side routing
 * - Context API for global state management (auth, theme)
 * - Protected routes ensure role-based access control
 * - Layout components provide consistent UI structure
 */

import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useAuth } from "./context/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";

// Provider Pages - Healthcare worker interface
import ProviderLayout from "./components/ProviderLayout";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderPatients from "./pages/ProviderPatients";
import CreatePatient from "./pages/CreatePatient";
import PatientDetail from "./pages/PatientDetail";

// Patient Pages - End user medication tracking interface
import PatientHome from "./pages/PatientHome";
import Learn from "./pages/Learn";
import Rewards from "./pages/Rewards";
import PatientAnalytics from "./pages/PatientAnalytics";
import PatientHistory from "./pages/PatientHistory";
import PatientLayout from "./components/PatientLayout";

// Shared Pages - Accessible by multiple roles
import Messenger from "./pages/Messenger";
import Settings from "./pages/Settings";
import LandingPage from "./pages/LandingPage";

// Admin Pages - System administration interface
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";

import { Toaster } from "react-hot-toast";

function App() {
  /**
   * Main Application Component
   *
   * Registers service worker for offline functionality and PWA features.
   * Sets up the application with authentication, theming, and routing providers.
   */
  useEffect(() => {
    // Register service worker for push notifications and offline functionality
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered: ", registration);
          })
          .catch((registrationError) => {
            console.log("SW registration failed: ", registrationError);
          });
      });
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          {/* Global toast notification system */}
          <Toaster position="top-center" reverseOrder={false} />
          <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans transition-colors duration-300 dark:bg-neutral-900 dark:text-neutral-50">
            <Routes>
              {/* Public login route */}
              <Route path="/login" element={<Login />} />

              {/* Provider Routes - Healthcare worker interface */}
              <Route
                path="/provider"
                element={
                  <ProtectedRoute allowedRoles={["provider"]}>
                    <ProviderLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<ProviderDashboard />} />
                <Route path="patients" element={<ProviderPatients />} />
                <Route path="patients/new" element={<CreatePatient />} />
                <Route path="patients/:id" element={<PatientDetail />} />
                <Route path="messages" element={<Messenger />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Patient Routes - Medication adherence interface */}
              <Route
                path="/patient"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <PatientLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<PatientHome />} />
                <Route path="learn" element={<Learn />} />
                <Route path="history" element={<PatientHistory />} />
                <Route path="rewards" element={<Rewards />} />
                <Route path="analytics" element={<PatientAnalytics />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Shared Routes - Cross-role functionality */}
              <Route
                path="/messages"
                element={
                  <ProtectedRoute allowedRoles={["provider", "patient"]}>
                    <Messenger />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes - System administration */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route
                  path="patients"
                  element={<AdminUsers role="patient" />}
                />
                <Route
                  path="providers"
                  element={<AdminUsers role="provider" />}
                />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Default routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

const RootRedirect = () => {
  /**
   * Root Redirect Component
   *
   * Handles post-login redirection based on user role.
   * Provides loading state during authentication check.
   */
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        {/* Loading spinner during authentication check */}
        <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  // Role-based redirection to appropriate dashboard
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "provider")
    return <Navigate to="/provider/dashboard" replace />;
  return <Navigate to="/patient" replace />;
};

export default App;
