// src/pages/ManageSensor.jsx
import { useState, useEffect } from "react";
import {
  Plus,
  RefreshCw,
  Cpu,
  Activity,
  Droplets,
  Thermometer,
} from "lucide-react";
import sensorService from "../services/sensorServices";
import ipalService from "../services/ipalService";
import { getEntityStatusColor } from "../utils/statusConfig";
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

const SENSOR_TYPES = [
  {
    value: "ph",
    label: "pH",
    icon: Droplets,
    color: "text-blue-600 bg-blue-100",
  },
  {
    value: "tds",
    label: "TDS",
    icon: Activity,
    color: "text-green-600 bg-green-100",
  },
  {
    value: "temperature",
    label: "Temperature",
    icon: Thermometer,
    color: "text-red-600 bg-red-100",
  },
];

const SENSOR_LOCATIONS = [
  { value: "inlet", label: "Inlet" },
  { value: "outlet", label: "Outlet" },
];

const ManageSensor = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";

  const [sensors, setSensors] = useState([]);
  const [ipals, setIpals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSensor, setEditingSensor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { success, error, setSuccess, setError } = useToast();
  const [filterIpal, setFilterIpal] = useState("");

  // Form state
  const [form, setForm] = useState({
    ipal_id: "",
    sensor_type: "",
    sensor_location: "",
    sensor_description: "",
    status: "active",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sensorResult, ipalList] = await Promise.all([
        sensorService.getAllSensors({ limit: 200 }),
        ipalService.getAllIpals(),
      ]);
      setSensors(sensorResult.sensors || []);
      setIpals(Array.isArray(ipalList) ? ipalList : []);
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSensors = async () => {
    try {
      const filters = { limit: 200 };
      if (filterIpal) filters.ipal_id = filterIpal;
      const result = await sensorService.getAllSensors(filters);
      setSensors(result.sensors || []);
    } catch (err) {
      setError("Failed to refresh sensors");
    }
  };

  useEffect(() => {
    if (!loading) fetchSensors();
  }, [filterIpal]);

  const resetForm = () => {
    setForm({
      ipal_id: "",
      sensor_type: "",
      sensor_location: "",
      sensor_description: "",
      status: "active",
    });
    setEditingSensor(null);
    setShowForm(false);
  };

  const handleEdit = (sensor) => {
    setForm({
      ipal_id: sensor.ipal_id || "",
      sensor_type: sensor.sensor_type || "",
      sensor_location: sensor.sensor_location || "",
      sensor_description: sensor.sensor_description || "",
      status: sensor.status || "active",
    });
    setEditingSensor(sensor);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingSensor) {
        await sensorService.updateSensor(editingSensor.id, {
          sensor_description: form.sensor_description,
          status: form.status,
        });
        setSuccess(`Sensor ${editingSensor.id} updated successfully`);
      } else {
        const payload = {
          ...form,
          ipal_id: Number(form.ipal_id),
        };
        await sensorService.createSensor(payload);
        setSuccess(
          `Sensor ${form.sensor_type.toUpperCase()} ${form.sensor_location} created successfully`,
        );
      }
      resetForm();
      fetchSensors();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Operation failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sensorId) => {
    try {
      setSubmitting(true);
      await sensorService.deleteSensor(sensorId);
      setSuccess("Sensor deleted successfully");
      setDeleteConfirm(null);
      fetchSensors();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Delete failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-dismiss handled by useToast hook

  const getSensorMeta = (type) =>
    SENSOR_TYPES.find((s) => s.value === type) || SENSOR_TYPES[0];

  const getIpalName = (ipalId) => {
    const ipal = ipals.find((i) => i.ipal_id === ipalId);
    return ipal ? ipal.ipal_location : `IPAL ${ipalId}`;
  };

  if (loading) return <LoadingScreen message="Loading sensors..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Manage Sensors"
        subtitle="Add, edit, or remove sensors from IPAL facilities"
        actions={
          <>
            <button
              onClick={fetchSensors}
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
              Add Sensor
            </button>
          </>
        }
      />

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">
          Filter IPAL:
        </label>
        <select
          value={filterIpal}
          onChange={(e) => setFilterIpal(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">All IPALs</option>
          {ipals.map((ipal) => (
            <option key={ipal.ipal_id} value={ipal.ipal_id}>
              {ipal.ipal_location}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          {sensors.length} sensor(s) found
        </span>
      </div>

      {/* Messages */}
      <Toast
        type="success"
        message={success}
        onDismiss={() => setSuccess(null)}
      />
      <Toast type="error" message={error} onDismiss={() => setError(null)} />

      {/* Create / Edit Form Modal */}
      <FormModal
        isOpen={showForm}
        onClose={resetForm}
        title={editingSensor ? "Edit Sensor" : "Add New Sensor"}
      >
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!editingSensor ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IPAL *
                </label>
                <select
                  required
                  value={form.ipal_id}
                  onChange={(e) =>
                    setForm({ ...form, ipal_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select IPAL</option>
                  {ipals.map((ipal) => (
                    <option key={ipal.ipal_id} value={ipal.ipal_id}>
                      {ipal.ipal_location} (ID: {ipal.ipal_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sensor Type *
                </label>
                <select
                  required
                  value={form.sensor_type}
                  onChange={(e) =>
                    setForm({ ...form, sensor_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select Type</option>
                  {SENSOR_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sensor Location *
                </label>
                <select
                  required
                  value={form.sensor_location}
                  onChange={(e) =>
                    setForm({ ...form, sensor_location: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select Location</option>
                  {SENSOR_LOCATIONS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p>
                <strong>Sensor ID:</strong> {editingSensor.id}
              </p>
              <p>
                <strong>Type:</strong>{" "}
                {editingSensor.sensor_type?.toUpperCase()}
              </p>
              <p>
                <strong>Location:</strong> {editingSensor.sensor_location}
              </p>
              <p>
                <strong>IPAL:</strong> {getIpalName(editingSensor.ipal_id)}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description {editingSensor ? "" : "(optional)"}
            </label>
            <input
              type="text"
              value={form.sensor_description}
              onChange={(e) =>
                setForm({ ...form, sensor_description: e.target.value })
              }
              placeholder="e.g. Primary inlet pH sensor"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {editingSensor && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          )}

          <FormModalFooter
            onCancel={resetForm}
            loading={submitting}
            submitLabel={editingSensor ? "Update" : "Save"}
          />
        </form>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm.id)}
        title="Delete Sensor"
        entityName={deleteConfirm?.id}
        loading={submitting}
      />

      {/* Sensor Grid */}
      {sensors.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="No Sensors Found"
          message='Click "Add Sensor" to register a new sensor'
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map((sensor) => {
            const meta = getSensorMeta(sensor.sensor_type);
            const Icon = meta.icon;
            return (
              <div
                key={sensor.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${meta.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {meta.label}
                      </h4>
                      <p className="text-xs text-gray-500 capitalize">
                        {sensor.sensor_location}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${getEntityStatusColor(sensor.status)}`}
                  >
                    {sensor.status}
                  </span>
                </div>

                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  <p>
                    <span className="font-medium text-gray-600">ID:</span>{" "}
                    {sensor.id}
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">IPAL:</span>{" "}
                    {getIpalName(sensor.ipal_id)}
                  </p>
                  {sensor.sensor_description && (
                    <p className="truncate">{sensor.sensor_description}</p>
                  )}
                  {sensor.latest_reading && (
                    <p>
                      <span className="font-medium text-gray-600">Latest:</span>{" "}
                      {sensor.latest_reading.value}{" "}
                      {sensor.latest_reading.unit || ""}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <ActionButton
                    variant="edit"
                    onClick={() => handleEdit(sensor)}
                  />
                  {isSuperAdmin && (
                    <ActionButton
                      variant="delete"
                      onClick={() => setDeleteConfirm(sensor)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageSensor;
