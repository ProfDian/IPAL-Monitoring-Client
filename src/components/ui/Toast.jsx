// src/components/ui/Toast.jsx
import React from "react";
import { Check, AlertTriangle, Info, X } from "lucide-react";

/**
 * Toast notification component for success/error/info messages
 *
 * @param {"success"|"error"|"info"} type - Toast type
 * @param {string} message - Message to display
 * @param {function} onDismiss - Optional callback to manually dismiss
 */
const Toast = ({ type = "success", message, onDismiss }) => {
  if (!message) return null;

  const config = {
    success: {
      bg: "bg-green-50 border-green-200 text-green-800",
      icon: Check,
    },
    error: {
      bg: "bg-red-50 border-red-200 text-red-800",
      icon: AlertTriangle,
    },
    info: {
      bg: "bg-blue-50 border-blue-200 text-blue-800",
      icon: Info,
    },
  };

  const { bg, icon: Icon } = config[type] || config.info;

  return (
    <div
      className={`flex items-center gap-2 p-3 border rounded-lg text-sm ${bg}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-0.5 rounded hover:bg-black/5 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default Toast;
