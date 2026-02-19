import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";

// Provider Pages
import ProviderLayout from "./components/ProviderLayout";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderPatients from "./pages/ProviderPatients";
import CreatePatient from "./pages/CreatePatient";
import PatientDetail from "./pages/PatientDetail";

// Patient Pages
import PatientHome from "./pages/PatientHome";
import Learn from "./pages/Learn";
import Rewards from "./pages/Rewards";
import PatientAnalytics from "./pages/PatientAnalytics";
import PatientHistory from "./pages/PatientHistory";
import PatientLayout from "./components/PatientLayout";
// import PatientDetail from "./pages/PatientDetail"; // Seemed unused or TBD

// Shared Pages
import Messenger from "./pages/Messenger";
import Settings from "./pages/Settings";
import LandingPage from "./pages/LandingPage";

// Admin Pages
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-center" reverseOrder={false} />
        <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Provider Routes */}
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
              <Route path="patients/:id" element={<PatientDetail />} />
              <Route path="messages" element={<Messenger />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Patient Routes */}
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

            {/* Shared Routes (if accessed directly, but ideally via layout) */}
            <Route
              path="/messages"
              element={
                <ProtectedRoute allowedRoles={["provider", "patient"]}>
                  <Messenger />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
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
              <Route path="patients" element={<AdminUsers role="patient" />} />
              <Route
                path="providers"
                element={<AdminUsers role="provider" />}
              />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Default Redirect */}
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "provider")
    return <Navigate to="/provider/dashboard" replace />;
  return <Navigate to="/patient" replace />;
};

export default App;
