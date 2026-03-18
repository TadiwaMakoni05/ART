import React, { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Loader,
  Filter,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";

/*
  AdminUsers.jsx

  User management UI for administrators.
  - Can create/edit/delete users with roles (patient/provider).
  - Includes search, filtering, and confirmation modals.
  - Uses backend admin endpoints for user CRUD operations.
*/

const AdminUsers = ({ role }) => {
  // role = 'patient' or 'provider'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // content for modal (null = create)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    phone: "",
    dob: "",
    role: role,
  });

  // Reload users list whenever role changes (patient/provider)
  useEffect(() => {
    fetchUsers();
  }, [role]);

  // Reset form when modal opens/closes or role changes
  useEffect(() => {
    if (!isModalOpen) {
      setFormData({
        username: "",
        password: "",
        full_name: "",
        phone: "",
        dob: "",
        role: role,
      });
      setCurrentUser(null);
    }
  }, [isModalOpen, role]);

  // Fetch all users and filter client-side by role (patient/provider).
  // Assumes the backend returns a full user list on the admin endpoint.
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("admin/users/");
      // Filter by role on frontend since backend returns all
      const filtered = res.data.filter((u) => u.role === role);
      setUsers(filtered);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  // Create or update a user record based on whether we are editing an existing user.
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (currentUser) {
        // Edit
        await api.put(`admin/users/${currentUser.id}/`, formData);
      } else {
        // Create
        await api.post("admin/users/", formData);
      }
      setIsModalOpen(false);
      fetchUsers();
      toast.success(
        currentUser ? "User updated successfully" : "User created successfully",
      );
    } catch (error) {
      console.error("Failed to save user", error);
      toast.error("Error saving user. Please check inputs.");
    }
  };

  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  // Deletes the selected user after confirmation.
  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`admin/users/${userToDelete.id}/`);
      fetchUsers();
      toast.success("User deleted");
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete user", error);
      toast.error("Failed to delete user");
    }
  };

  // Prefill the form for editing an existing user.
  // Password is intentionally left blank (no change) since it is not returned by the API.
  const openEdit = (user) => {
    setFormData({
      username: user.username,
      password: "", // Leave blank to keep unchanged
      full_name: user.full_name || "",
      phone: user.phone || "",
      dob: user.dob || "",
      role: role,
    });
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.full_name &&
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4 md:p-8">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="h-10 bg-neutral-200 rounded w-24"></div>
        </div>
        <div className="h-12 bg-neutral-200 rounded w-full"></div>
        <div className="h-64 bg-neutral-200 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${role === "patient" ? "Patient" : "Provider"}`}
        message={`Are you sure you want to delete this ${role}? This action cannot be undone.`}
        isDanger={true}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold capitalize">{role}s Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-4 py-2  flex items-center gap-2 hover:bg-neutral-800 transition"
        >
          <Plus size={18} />
          Add {role}
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 p-4  shadow-sm border border-neutral-200 flex items-center gap-3">
        <Search className="text-neutral-400" size={20} />
        <input
          type="text"
          placeholder={`Search ${role}s...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 outline-none text-neutral-900 dark:text-neutral-100"
        />
      </div>

      <div className="hidden lg:block bg-white dark:bg-neutral-900  shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                  Username
                </th>
                <th className="px-6 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                  Status
                </th>
                <th className="px-6 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                  Created At
                </th>
                <th className="px-6 py-3 font-medium text-neutral-500 dark:text-neutral-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-neutral-50 dark:bg-neutral-950 transition"
                >
                  <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                    {user.username}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1  text-xs font-medium ${user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(user)}
                      className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-blue-600 bg-neutral-100 dark:bg-neutral-800  transition"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => confirmDelete(user)}
                      className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-red-600 bg-neutral-100 dark:bg-neutral-800  transition"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Grid */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white dark:bg-neutral-900 p-4 shadow-sm border border-neutral-200 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                  {user.username}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Created: {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium ${
                  user.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="flex gap-2 pt-2 border-t border-neutral-100">
              <button
                onClick={() => openEdit(user)}
                className="flex-1 py-2 text-center text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:bg-neutral-800"
              >
                Edit
              </button>
              <button
                onClick={() => confirmDelete(user)}
                className="flex-1 py-2 text-center text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
            No users found.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900  shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {currentUser ? "Edit" : "Add"} {role}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-black dark:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full p-2 border  focus:ring-2 ring-black outline-none"
                  required
                />
              </div>

              {!currentUser && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full p-2 border  focus:ring-2 ring-black outline-none"
                    required={!currentUser}
                  />
                </div>
              )}

              {currentUser && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    New Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Leave blank to keep current"
                    className="w-full p-2 border  focus:ring-2 ring-black outline-none"
                  />
                </div>
              )}

              {role === "patient" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      className="w-full p-2 border  focus:ring-2 ring-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full p-2 border  focus:ring-2 ring-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      DOB
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) =>
                        setFormData({ ...formData, dob: e.target.value })
                      }
                      className="w-full p-2 border  focus:ring-2 ring-black outline-none"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-black text-white  font-bold hover:bg-neutral-800 transition"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
