import React, { useState } from "react";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";
import api from "../services/api";
import AuthContext from "./useAuth";

const clearStorage = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("role");
  localStorage.removeItem("user_id");
  localStorage.removeItem("full_name");
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");
    const user_id = localStorage.getItem("user_id");
    const full_name = localStorage.getItem("full_name");

    if (token && role) {
      try {
        const decoded = jwtDecode(token);
        return {
          ...decoded,
          role,
          user_id,
          full_name,
        };
      } catch (e) {
        console.error("Invalid token", e);
        clearStorage();
        return null;
      }
    }
    return null;
  });

  const loading = false;

  const login = async (username, password) => {
    try {
      const response = await api.post("auth/token/", {
        username,
        password,
      });

      const {
        access,
        refresh,
        role,
        user_id,
        username: responseUsername,
        full_name: responseFullName,
      } = response.data;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("role", role);
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("full_name", responseFullName);

      const decoded = jwtDecode(access);

      setUser({
        ...decoded,
        role,
        user_id,
        username: responseUsername,
        full_name: responseFullName,
      });

      toast.success(`Welcome back, ${responseFullName || responseUsername}!`);

      return role;
    } catch (error) {
      toast.error("Login failed. Please check your credentials.");
      throw error;
    }
  };

  const logout = () => {
    clearStorage();
    setUser(null);
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
