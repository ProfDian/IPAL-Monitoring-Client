// src/components/ui/EmptyState.jsx
import React from "react";
import { Inbox } from "lucide-react";

/**
 * Reusable empty state display
 *
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} title - Empty state title
 * @param {string} message - Description text
 * @param {React.ReactNode} action - Optional action button/element
 * @param {string} className - Additional classes
 */
const EmptyState = ({
  icon: Icon = Inbox,
  title = "No Data Found",
  message = "",
  action,
  className = "",
}) => {
  return (
    <div
      className={`text-center py-16 bg-white rounded-xl border border-gray-200 ${className}`}
    >
      <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {message && <p className="text-sm text-gray-500 mt-1">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
