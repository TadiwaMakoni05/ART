import React, { useState } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

/*
  Login.jsx

  Authentication screen for ART Companion.
  - Collects username/password and calls auth context login.
  - Redirects to role-specific dashboard (patient/provider/admin).
*/

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handle login form submission and route user based on role.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const role = await login(username, password);
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "provider") {
        navigate("/provider");
      } else {
        navigate("/patient");
      }
    } catch (err) {
      setError("Invalid credentials", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-100 dark:bg-neutral-800">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-neutral-900 shadow-lg border border-neutral-200 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <h2 className="text-3xl font-bold text-center text-neutral-900 dark:text-neutral-100 tracking-tight">
          ART Companion
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 mt-1 border border-neutral-300  focus:ring-2 focus:ring-black focus:outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 border border-neutral-300  focus:ring-2 focus:ring-black focus:outline-none transition"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 font-semibold text-white bg-black  hover:bg-neutral-800 transition transform active:scale-95"
          >
            Sign In
          </button>
        </form>
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:underline"
          >
            Secure Healthcare System
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
