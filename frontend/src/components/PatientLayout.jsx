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
} from "lucide-react";
import { useAuth } from "../context/useAuth";

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
    <div className="min-h-screen bg-neutral-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl text-neutral-900">
            <Shield className="text-black" />
            <span>ART Companion</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-neutral-400 hover:text-black"
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
                    ? "bg-black text-white"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-black"
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8  bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-700">
              {user?.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate text-neutral-900">
                {user?.full_name || user?.username}
              </p>
              <p className="text-xs text-neutral-500 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-neutral-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Shield className="text-black w-5 h-5" />
            <span>ART Companion</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-neutral-600"
          >
            <Menu size={24} />
          </button>
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
