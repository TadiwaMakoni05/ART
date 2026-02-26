import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/useTheme";

const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-colors ${
        theme === "dark"
          ? "bg-neutral-800 text-yellow-400 hover:bg-neutral-700"
          : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
      } ${className}`}
      aria-label="Toggle theme"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default ThemeToggle;
