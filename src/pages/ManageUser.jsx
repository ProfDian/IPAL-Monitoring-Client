// src/pages/ManageUser.jsx
import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  Users,
  Shield,
  ShieldCheck,
  Mail,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import userService from "../services/userService";
import { useAuth } from "../context/AuthContext";
import {
  LoadingScreen,
  Toast,
  PageHeader,
  EmptyState,
} from "../components/ui";
import FormModal, { FormModalFooter } from "../components/ui/FormModal";
import ConfirmDeleteModal from "../components/ui/ConfirmDeleteModal";
import useToast from "../hooks/useToast";

const ManageUser = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "superadmin";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { success, error, setSuccess, setError } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      const userList = data?.data || data?.users || data || [];
      setUsers(Array.isArray(userList) ? userList : []);
    } catch (err) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ email: "", password: "", username: "" });
    setShowForm(false);
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await userService.createUser({
        email: form.email,
        password: form.password,
        username: form.username,
        role: "admin",
      });
      setSuccess(`Admin "${form.username}" created successfully`);
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (uid) => {
    try {
      setSubmitting(true);
      await userService.deleteUser(uid);
      setSuccess("User deleted successfully");
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Delete failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-dismiss handled by useToast hook

  const getRoleIcon = (role) => {
    if (role === "superadmin")
      return <ShieldCheck className="w-4 h-4 text-amber-600" />;
    return <Shield className="w-4 h-4 text-cyan-600" />;
  };

  const getRoleBadge = (role) => {
    if (role === "superadmin") return "bg-amber-100 text-amber-700";
    return "bg-cyan-100 text-cyan-700";
  };

  if (loading) return <LoadingScreen message="Loading users..." />;

  // Only superadmin can access user management
  if (!isSuperAdmin) {
    return (
      <EmptyState
        icon={Shield}
        title="Access Denied"
        message="Only SuperAdmin can manage users"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Manage Users"
        subtitle="Add or remove admin accounts"
        actions={
          <>
            <button
              onClick={fetchUsers}
              className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700 transition"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Admin
            </button>
          </>
        }
      />

      {/* Messages */}
      <Toast type="success" message={success} onDismiss={() => setSuccess(null)} />
      <Toast type="error" message={error} onDismiss={() => setError(null)} />

      {/* Create Form Modal */}
      <FormModal
        isOpen={showForm}
        onClose={resetForm}
        title="Add New Admin"
      >
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    placeholder="e.g. admin_tl"
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="e.g. admin@example.com"
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="Min. 6 characters"
                    className="w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                <p className="font-medium mb-1">Note:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>
                    User will be created with <strong>Admin</strong> role
                  </li>
                  <li>SuperAdmin can only be created via Firebase Console</li>
                  <li>Admin can manage IPAL & Sensors (except delete)</li>
                </ul>
              </div>

              <FormModalFooter
                onCancel={resetForm}
                loading={submitting}
                submitLabel="Create Admin"
              />
            </form>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDeleteModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm.uid)}
        title="Delete User"
        entityName={deleteConfirm?.username || deleteConfirm?.email}
        loading={submitting}
      />

      {/* User Table */}
      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Users Found"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-cyan-700">
                            {(u.username || u.email || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {u.username || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {u.email}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${getRoleBadge(u.role)}`}
                      >
                        {getRoleIcon(u.role)}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {u.role !== "superadmin" &&
                        u.uid !== currentUser?.uid && (
                          <button
                            onClick={() => setDeleteConfirm(u)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Delete
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="sm:hidden divide-y divide-gray-100">
            {users.map((u) => (
              <div key={u.uid} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-cyan-700">
                        {(u.username || u.email || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {u.username || "-"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {u.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${getRoleBadge(u.role)}`}
                  >
                    {getRoleIcon(u.role)}
                    {u.role}
                  </span>
                </div>
                {u.role !== "superadmin" && u.uid !== currentUser?.uid && (
                  <button
                    onClick={() => setDeleteConfirm(u)}
                    className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete User
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUser;
