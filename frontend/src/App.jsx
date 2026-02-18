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
// import PatientDetail from "./pages/PatientDetail"; // Seemed unused or TBD

// Shared Pages
import Messenger from "./pages/Messenger";

// Admin Pages
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";

function App() {
  return (
    <AuthProvider>
      <Router>
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
              <Route path="messages" element={<Messenger />} />
            </Route>

            {/* Patient Routes */}
            <Route
              path="/patient"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/learn"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <Learn />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/history"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/rewards"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <Rewards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/analytics"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientAnalytics />
                </ProtectedRoute>
              }
            />

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
              <Route
                path="settings"
                element={<div>Settings Component TBD</div>}
              />
            </Route>

            {/* Default Redirect */}
            <Route path="/" element={<RootRedirect />} />
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
