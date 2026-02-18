// src/components/ui/FormModal.jsx
import React from "react";
import { X } from "lucide-react";

/**
 * Reusable form modal wrapper with backdrop, header, close button
 *
 * @param {boolean} isOpen - Show/hide the modal
 * @param {function} onClose - Close handler
 * @param {string} title - Modal title
 * @param {React.ReactNode} children - Form content
 * @param {string} maxWidth - Tailwind max-w class, default "max-w-md"
 * @param {boolean} scrollable - Allow scrolling for long forms
 */
const FormModal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
  scrollable = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} ${scrollable ? "max-h-[90vh] overflow-y-auto" : ""}`}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/**
 * Footer for FormModal with Cancel + Submit buttons
 *
 * @param {function} onCancel - Cancel handler
 * @param {boolean} loading - Show loading state
 * @param {string} submitLabel - Label for submit button
 * @param {string} loadingLabel - Label while loading
 */
const FormModalFooter = ({
  onCancel,
  loading = false,
  submitLabel = "Save",
  loadingLabel = "Saving...",
}) => (
  <div className="flex justify-end gap-3 pt-3 border-t">
    <button
      type="button"
      onClick={onCancel}
      className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={loading}
      className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50"
    >
      {loading ? loadingLabel : submitLabel}
    </button>
  </div>
);

export { FormModalFooter };
export default FormModal;
