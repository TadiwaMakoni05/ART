import React, { useState } from "react";
// import api from "../services/api";
import { useAuth } from "../context/useAuth";
import toast from "react-hot-toast";

import {
  User,
  Lock,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  Monitor,
  Globe,
  Database,
  FileText,
  Smartphone,
  Trophy,
  Eye,
} from "lucide-react";

/*
  Settings.jsx

  User settings dashboard.
  - Provides profile editing, security (password change), and notification preferences.
  - Renders different tabs based on user role (patient/provider/admin).
  - Uses mock state and timeouts for demo purposes; replace with real API calls as needed.
*/

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Profile Form State
  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Mock Settings State
  const [settings, setSettings] = useState({
    emailNotifs: true,
    pushNotifs: true,
    whatsappNotifs: false,
    darkMode: false,
    dataSharing: false,
    twoFactor: false,
  });

  // Handle updating profile information. Currently mocked with a timeout.
  // Replace with a real API call to persist changes to the user profile.
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    try {
      // Assuming endpoint exists or mocking it
      // await api.put(`/users/${user.id}/`, profileData);
      setTimeout(() => {
        setSuccessMsg("Profile updated successfully!");
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to update profile", error);
      setLoading(false);
    }
  };

  // Handle password changes. This is currently mocked but shows where an API call would happen.
  // Validates passwords match before attempting to send a request.
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      // Mock password update
      // await api.post("auth/change-password/", {
      //   old_password: passwordData.currentPassword,
      //   new_password: passwordData.newPassword,
      // });
      setTimeout(() => {
        toast.success("Password changed successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }, 1000);
    } catch (error) {
      console.error("Error changing password", error);
      toast.error("Failed to change password");
    }
  };

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sections = [
    { id: "profile", label: "Profile Settings", icon: User },
    { id: "security", label: "Security & Login", icon: Lock },
    ...(user?.role === "patient"
      ? [
          { id: "notifications", label: "Notifications", icon: Bell },
          { id: "gamification", label: "Rewards & Goals", icon: Trophy },
          { id: "privacy", label: "Privacy & Data", icon: Eye },
        ]
      : []),
    ...(user?.role === "provider"
      ? [
          { id: "communication", label: "Patient Alerts", icon: Bell },
          { id: "reports", label: "Reports Config", icon: FileText },
          { id: "preferences", label: "App Preferences", icon: Monitor },
        ]
      : []),
    ...(user?.role === "admin"
      ? [
          { id: "system", label: "System Config", icon: Database },
          { id: "global_reports", label: "Global Trends", icon: Globe },
          { id: "audit", label: "Audit Logs", icon: Shield },
        ]
      : []),
    { id: "support", label: "Support & Help", icon: HelpCircle },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8 text-neutral-900 dark:text-neutral-100">
        Settings
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar / Tabs */}
        <div className="w-full md:w-64 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === section.id
                  ? "bg-black text-white shadow-md"
                  : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:bg-neutral-800"
              }`}
            >
              <section.icon size={18} />
              <span className="font-medium">{section.label}</span>
              {activeTab === section.id && (
                <ChevronRight size={16} className="ml-auto" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-neutral-900 p-6 md:p-8 shadow-sm border border-neutral-200">
          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded">
              {successMsg}
            </div>
          )}

          {/* PROFILE SECTION */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <h2 className="text-xl font-bold border-b pb-4 mb-6">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        full_name: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-neutral-300 focus:ring-2 ring-black outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profileData.username}
                    disabled
                    className="w-full p-2 border border-neutral-300 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    className="w-full p-2 border border-neutral-300 focus:ring-2 ring-black outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    className="w-full p-2 border border-neutral-300 focus:ring-2 ring-black outline-none transition"
                  />
                </div>
              </div>

              {user?.role === "provider" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Specialty / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Nurse"
                    className="w-full p-2 border border-neutral-300 focus:ring-2 ring-black outline-none transition"
                  />
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-black text-white font-medium hover:bg-neutral-800 transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* SECURITY SECTION */}
          {activeTab === "security" && (
            <div className="space-y-8">
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <h2 className="text-xl font-bold border-b pb-4 mb-6">
                  Change Password
                </h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-neutral-300 focus:ring-2 ring-black outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-neutral-300 focus:ring-2 ring-black outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-neutral-300 focus:ring-2 ring-black outline-none transition"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>

              <div className="pt-8 border-t">
                <h3 className="text-lg font-bold mb-4">
                  Two-Factor Authentication
                </h3>
                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-950 rounded border border-neutral-100">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      Enable 2FA (SMS/Email)
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Add an extra layer of security to your account.
                    </p>
                  </div>
                  <button
                    onClick={() => toggleSetting("twoFactor")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.twoFactor ? "bg-black" : "bg-neutral-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        settings.twoFactor ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS (Patient) */}
          {activeTab === "notifications" && user?.role === "patient" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold border-b pb-4 mb-6">
                Notification Preferences
              </h2>
              <div className="space-y-4">
                {[
                  {
                    key: "pushNotifs",
                    label: "Pill Reminders (Push)",
                    desc: "Receive daily alerts for medication times.",
                  },
                  {
                    key: "emailNotifs",
                    label: "Email Summaries",
                    desc: "Weekly progress reports sent to your email.",
                  },
                  {
                    key: "whatsappNotifs",
                    label: "WhatsApp Alerts",
                    desc: "Get critical reminders via WhatsApp.",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 border border-neutral-100 rounded hover:border-neutral-200 transition"
                  >
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {item.desc}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleSetting(item.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings[item.key] ? "bg-green-500" : "bg-neutral-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                          settings[item.key] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DUMMY SECTIONS (Placeholders) */}
          {["gamification", "privacy", "support"].includes(activeTab) && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Coming Soon
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                This section ({activeTab}) is currently under development. Check
                back later for updates!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
