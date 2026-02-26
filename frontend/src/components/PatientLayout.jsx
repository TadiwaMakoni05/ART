import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Trophy,
  BarChart2,
  MessageSquare,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Clock,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import ThemeToggle from "./ThemeToggle";

const PatientLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      path: "/patient",
      label: "Home",
      icon: <Home size={20} />,
      end: true, // Exact match for home
    },
    {
      path: "/patient/rewards",
      label: "Rewards",
      icon: <Trophy size={20} />,
    },
    {
      path: "/patient/analytics",
      label: "Analytics",
      icon: <BarChart2 size={20} />,
    },
    {
      path: "/patient/history",
      label: "History",
      icon: <Clock size={20} />,
    },
    {
      path: "/messages",
      label: "Chat",
      icon: <MessageSquare size={20} />,
    },
    {
      path: "/patient/learn",
      label: "Learn",
      icon: <BookOpen size={20} />,
    },
    {
      path: "/patient/settings",
      label: "Settings",
      icon: <Settings size={20} />,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex transition-colors duration-300">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl text-neutral-900 dark:text-neutral-50">
            <Shield className="text-black dark:text-blue-500" />
            <span>ART Companion</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-neutral-400 hover:text-black dark:hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 transition-colors ${
                  isActive
                    ? "bg-black text-white dark:bg-blue-600 dark:text-white"
                    : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white"
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8  bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-700 dark:text-neutral-300">
              {user?.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate text-neutral-900 dark:text-neutral-50">
                {user?.full_name || user?.username}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Theme
            </span>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
            <Shield className="text-black dark:text-blue-500 w-5 h-5" />
            <span>ART Companion</span>
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

export default PatientLayout;
