// src/components/ui/ConfirmDeleteModal.jsx
import React from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Reusable delete confirmation modal
 *
 * @param {boolean} isOpen - Show/hide the modal
 * @param {function} onClose - Close handler
 * @param {function} onConfirm - Confirm delete handler
 * @param {string} title - e.g. "Delete Sensor"
 * @param {string} entityName - Name of entity to display (bold)
 * @param {string} description - Additional warning text
 * @param {boolean} loading - Show loading state on confirm button
 */
const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  entityName = "",
  description = "",
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">
              This action cannot be undone
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          Are you sure you want to delete{" "}
          {entityName ? <strong>{entityName}</strong> : "this item"}?
          {description && (
            <span className="block mt-1 text-gray-500">{description}</span>
          )}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
