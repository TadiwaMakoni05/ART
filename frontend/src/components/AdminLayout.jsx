import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import ThemeToggle from "./ThemeToggle";

const AdminLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      path: "/admin/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { path: "/admin/patients", label: "Patients", icon: <Users size={20} /> },
    {
      path: "/admin/providers",
      label: "Providers",
      icon: <Stethoscope size={20} />,
    },
    {
      path: "/admin/settings",
      label: "Settings",
      icon: <Settings size={20} />,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex transition-colors duration-300">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900 dark:bg-black text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl">
            <ShieldAlert className="text-red-500" />
            <span>Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-neutral-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3  transition-colors ${
                  isActive
                    ? "bg-neutral-800 dark:bg-neutral-800 text-white"
                    : "text-neutral-400 hover:bg-neutral-800 dark:hover:bg-neutral-900 hover:text-white"
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8  bg-neutral-700 flex items-center justify-center text-xs font-bold text-white">
              {user?.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate text-white">
                {user?.full_name || user?.username}
              </p>
              <p className="text-xs text-neutral-500 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">Theme</span>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-neutral-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50 dark:bg-neutral-900">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-50">
            <ShieldAlert className="text-red-500 w-5 h-5" />
            <span>Admin Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-neutral-600 dark:text-neutral-400"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
