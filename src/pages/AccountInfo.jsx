// src/pages/AccountInfo.jsx
import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  Clock,
  Edit3,
  X,
  Save,
} from "lucide-react";
import userService from "../services/userService";
import { useAuth } from "../context/AuthContext";
import { Toast, PageHeader, InlineLoader } from "../components/ui";
import useToast from "../hooks/useToast";

const AccountInfo = () => {
  const { user, setUser } = useAuth();

  const [profile, setProfile] = useState(user); // will be replaced by API data
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [submitting, setSubmitting] = useState(false);
  const { success, error, setSuccess, setError } = useToast();

  // Fetch fresh profile data from API on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userService.getProfile();
        if (response?.success && response.user) {
          setProfile(response.user);
          setUsername(response.user.username || "");
          // Sync context & localStorage with latest data
          const merged = { ...user, ...response.user };
          setUser(merged);
          localStorage.setItem("user", JSON.stringify(merged));
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        // Fallback to context data
        setProfile(user);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss handled by useToast hook

  const handleSave = async () => {
    if (!username.trim()) {
      setError("Username cannot be empty");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const response = await userService.updateProfile({
        username: username.trim(),
      });

      // Update user in context & localStorage
      const updatedUser = { ...user, username: username.trim() };
      if (response?.user) {
        updatedUser.username = response.user.username;
        updatedUser.updated_at = response.user.updated_at;
      }
      setUser(updatedUser);
      setProfile(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setSuccess("Username updated successfully");
      setEditing(false);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to update",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setUsername(profile?.username || "");
    setEditing(false);
  };

  const formatDate = (val) => {
    if (!val) return "-";
    try {
      // Handle Firestore Timestamp objects { _seconds, _nanoseconds }
      if (val._seconds) {
        return new Date(val._seconds * 1000).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        });
      }
      return new Date(val).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return String(val);
    }
  };

  const isSuperAdmin = profile?.role === "superadmin";

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <InlineLoader message="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Account Info"
        subtitle="View and manage your account details"
      />

      {/* Messages */}
      <Toast type="success" message={success} onDismiss={() => setSuccess(null)} />
      <Toast type="error" message={error} onDismiss={() => setError(null)} />

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Avatar Banner */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-8 flex items-center gap-5">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/40">
            <span className="text-2xl font-bold text-white">
              {(profile?.username || profile?.email || "?")
                .charAt(0)
                .toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              {profile?.username || "-"}
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mt-1 ${
                isSuperAdmin
                  ? "bg-amber-100/90 text-amber-800"
                  : "bg-cyan-100/90 text-cyan-800"
              }`}
            >
              {isSuperAdmin ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <Shield className="w-3.5 h-3.5" />
              )}
              {profile?.role}
            </span>
          </div>
        </div>

        {/* Info Fields */}
        <div className="p-6 space-y-5">
          {/* Username */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </p>
                {editing ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 w-56"
                      autoFocus
                    />
                    <button
                      onClick={handleSave}
                      disabled={submitting}
                      className="p-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-1.5 border rounded-lg hover:bg-gray-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {profile?.username || "-"}
                  </p>
                )}
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-cyan-700 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Edit
              </button>
            )}
          </div>

          <hr />

          {/* Email */}
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </p>
              <p className="text-sm text-gray-900 mt-0.5">{profile?.email}</p>
            </div>
          </div>

          <hr />

          {/* Role */}
          <div className="flex items-start gap-3">
            {isSuperAdmin ? (
              <ShieldCheck className="w-5 h-5 text-amber-500 mt-0.5" />
            ) : (
              <Shield className="w-5 h-5 text-cyan-500 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </p>
              <p className="text-sm text-gray-900 mt-0.5 capitalize">
                {profile?.role}
              </p>
            </div>
          </div>

          <hr />

          {/* Created At */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Created
              </p>
              <p className="text-sm text-gray-900 mt-0.5">
                {formatDate(profile?.created_at)}
              </p>
            </div>
          </div>

          {/* Updated At */}
          <hr />
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </p>
              <p className="text-sm text-gray-900 mt-0.5">
                {formatDate(profile?.updated_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountInfo;
