// src/pages/ManageIPAL.jsx
import { useState, useEffect } from "react";
import {
  Plus,
  MapPin,
  Activity,
  RefreshCw,
  Check,
  AlertTriangle,
  Building2,
  Phone,
  User,
  Clock,
} from "lucide-react";
import ipalService from "../services/ipalService";
import { getEntityStatusColor } from "../utils/statusConfig";
import { useIPAL } from "../context/IPALContext";
import { useAuth } from "../context/AuthContext";
import {
  LoadingScreen,
  Toast,
  PageHeader,
  EmptyState,
  ActionButton,
} from "../components/ui";
import FormModal, { FormModalFooter } from "../components/ui/FormModal";
import ConfirmDeleteModal from "../components/ui/ConfirmDeleteModal";
import useToast from "../hooks/useToast";

const ManageIPAL = () => {
  const { user } = useAuth();
  const { refreshIpalList } = useIPAL();
  const isSuperAdmin = user?.role === "superadmin";

  const [ipals, setIpals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIpal, setEditingIpal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { success, error, setSuccess, setError } = useToast();

  // Form state
  const [form, setForm] = useState({
    ipal_location: "",
    ipal_description: "",
    address: "",
    capacity: "",
    contact_person: "",
    contact_phone: "",
    operational_hours: "24/7",
    status: "active",
    coordinates: {
      lat: "",
      lng: "",
      inlet: { lat: "", lng: "" },
      outlet: { lat: "", lng: "" },
    },
  });

  useEffect(() => {
    fetchIpals();
  }, []);

  const fetchIpals = async () => {
    try {
      setLoading(true);
      const data = await ipalService.getAllIpals();
      setIpals(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to fetch IPALs");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      ipal_location: "",
      ipal_description: "",
      address: "",
      capacity: "",
      contact_person: "",
      contact_phone: "",
      operational_hours: "24/7",
      status: "active",
      coordinates: {
        lat: "",
        lng: "",
        inlet: { lat: "", lng: "" },
        outlet: { lat: "", lng: "" },
      },
    });
    setEditingIpal(null);
    setShowForm(false);
  };

  const handleEdit = (ipal) => {
    const coords = ipal.coordinates || {};
    setForm({
      ipal_location: ipal.ipal_location || "",
      ipal_description: ipal.ipal_description || "",
      address: ipal.address || "",
      capacity: ipal.capacity || "",
      contact_person: ipal.contact_person || "",
      contact_phone: ipal.contact_phone || "",
      operational_hours: ipal.operational_hours || "24/7",
      status: ipal.status || "active",
      coordinates: {
        lat: coords.lat ?? "",
        lng: coords.lng ?? "",
        inlet: {
          lat: coords.inlet?.lat ?? "",
          lng: coords.inlet?.lng ?? "",
        },
        outlet: {
          lat: coords.outlet?.lat ?? "",
          lng: coords.outlet?.lng ?? "",
        },
      },
    });
    setEditingIpal(ipal);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Build payload with numeric coordinates
      const payload = { ...form };
      const c = form.coordinates;
      const hasCoords =
        c.lat !== "" ||
        c.lng !== "" ||
        c.inlet.lat !== "" ||
        c.inlet.lng !== "" ||
        c.outlet.lat !== "" ||
        c.outlet.lng !== "";
      if (hasCoords) {
        payload.coordinates = {
          lat: c.lat !== "" ? Number(c.lat) : null,
          lng: c.lng !== "" ? Number(c.lng) : null,
          inlet: {
            lat: c.inlet.lat !== "" ? Number(c.inlet.lat) : null,
            lng: c.inlet.lng !== "" ? Number(c.inlet.lng) : null,
          },
          outlet: {
            lat: c.outlet.lat !== "" ? Number(c.outlet.lat) : null,
            lng: c.outlet.lng !== "" ? Number(c.outlet.lng) : null,
          },
        };
      } else {
        delete payload.coordinates;
      }

      if (editingIpal) {
        await ipalService.updateIpal(editingIpal.ipal_id, payload);
        setSuccess(`IPAL "${form.ipal_location}" updated successfully`);
      } else {
        await ipalService.createIpal(payload);
        setSuccess(`IPAL "${form.ipal_location}" created successfully`);
      }
      resetForm();
      fetchIpals();
      refreshIpalList();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Operation failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (ipalId) => {
    try {
      setSubmitting(true);
      await ipalService.deleteIpal(ipalId);
      setSuccess("IPAL deleted successfully");
      setDeleteConfirm(null);
      fetchIpals();
      refreshIpalList();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Delete failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-dismiss handled by useToast hook

  if (loading) return <LoadingScreen message="Loading IPAL data..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Manage IPAL"
        subtitle="Add, edit, or remove IPAL facilities"
        actions={
          <>
            <button
              onClick={fetchIpals}
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
              Add IPAL
            </button>
          </>
        }
      />

      {/* Success message */}
      <Toast type="success" message={success} onDismiss={() => setSuccess(null)} />

      {/* Error message */}
      <Toast type="error" message={error} onDismiss={() => setError(null)} />

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        onClose={resetForm}
        title={editingIpal ? "Edit IPAL" : "Add New IPAL"}
        maxWidth="max-w-lg"
        scrollable
      >
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IPAL Location Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.ipal_location}
                  onChange={(e) =>
                    setForm({ ...form, ipal_location: e.target.value })
                  }
                  placeholder="e.g. IPAL Teknik Lingkungan Undip"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  value={form.ipal_description}
                  onChange={(e) =>
                    setForm({ ...form, ipal_description: e.target.value })
                  }
                  placeholder="e.g. IPAL milik Teknik Lingkungan Undip"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="e.g. Jl. Prof. Sudarto, SH, Tembalang"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="text"
                    value={form.capacity}
                    onChange={(e) =>
                      setForm({ ...form, capacity: e.target.value })
                    }
                    placeholder="e.g. 100 m³/hari"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operational Hours
                  </label>
                  <input
                    type="text"
                    value={form.operational_hours}
                    onChange={(e) =>
                      setForm({ ...form, operational_hours: e.target.value })
                    }
                    placeholder="e.g. 24/7"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Person in Charge
                  </label>
                  <input
                    type="text"
                    value={form.contact_person}
                    onChange={(e) =>
                      setForm({ ...form, contact_person: e.target.value })
                    }
                    placeholder="e.g. Admin Teknik Lingkungan"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={form.contact_phone}
                    onChange={(e) =>
                      setForm({ ...form, contact_phone: e.target.value })
                    }
                    placeholder="e.g. +62-24-76480678"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
              </div>

              {editingIpal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              )}

              {/* Coordinates Section */}
              <div className="border-t pt-4 mt-2">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">
                  Coordinates
                </h4>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Map Center Lat
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.coordinates.lat}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          coordinates: {
                            ...form.coordinates,
                            lat: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. -7.0506"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Map Center Lng
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.coordinates.lng}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          coordinates: {
                            ...form.coordinates,
                            lng: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. 110.4397"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <p className="text-xs font-medium text-gray-500 mb-2">Inlet</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Lat
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.coordinates.inlet.lat}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          coordinates: {
                            ...form.coordinates,
                            inlet: {
                              ...form.coordinates.inlet,
                              lat: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="e.g. -7.050665"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Lng
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.coordinates.inlet.lng}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          coordinates: {
                            ...form.coordinates,
                            inlet: {
                              ...form.coordinates.inlet,
                              lng: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="e.g. 110.44008"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <p className="text-xs font-medium text-gray-500 mb-2">Outlet</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Lat
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.coordinates.outlet.lat}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          coordinates: {
                            ...form.coordinates,
                            outlet: {
                              ...form.coordinates.outlet,
                              lat: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="e.g. -7.050193"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Lng
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.coordinates.outlet.lng}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          coordinates: {
                            ...form.coordinates,
                            outlet: {
                              ...form.coordinates.outlet,
                              lng: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="e.g. 110.44035"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <FormModalFooter
                onCancel={resetForm}
                loading={submitting}
                submitLabel={editingIpal ? "Update" : "Save"}
              />
            </form>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm.ipal_id)}
        title="Delete IPAL"
        entityName={deleteConfirm?.ipal_location}
        description="All associated sensors will be deactivated."
        loading={submitting}
      />

      {/* IPAL List */}
      {ipals.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No IPAL Found"
          message='Click "Add IPAL" to add a new IPAL facility'
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ipals.map((ipal) => (
            <div
              key={ipal.ipal_id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {ipal.ipal_location}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {ipal.ipal_description}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${getEntityStatusColor(ipal.status)}`}
                >
                  {ipal.status}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                {ipal.address && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{ipal.address}</span>
                  </div>
                )}
                {ipal.capacity && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Activity className="w-3.5 h-3.5" />
                    <span>{ipal.capacity}</span>
                  </div>
                )}
                {ipal.contact_person && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <User className="w-3.5 h-3.5" />
                    <span>{ipal.contact_person}</span>
                  </div>
                )}
                {ipal.contact_phone && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{ipal.contact_phone}</span>
                  </div>
                )}
              </div>

              {/* ID Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  IPAL ID: {ipal.ipal_id}
                </span>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <ActionButton variant="edit" onClick={() => handleEdit(ipal)} />
                  {isSuperAdmin && (
                    <ActionButton variant="delete" onClick={() => setDeleteConfirm(ipal)} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageIPAL;
