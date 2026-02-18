// src/components/ui/ActionButton.jsx
import React from "react";
import { Edit3, Trash2 } from "lucide-react";

/**
 * Small action button for edit/delete in cards and tables
 *
 * @param {"edit"|"delete"} variant - Button variant
 * @param {function} onClick - Click handler
 * @param {string} label - Button label (default based on variant)
 * @param {string} className - Additional classes
 */
const ActionButton = ({ variant = "edit", onClick, label, className = "" }) => {
  const config = {
    edit: {
      style: "text-cyan-700 bg-cyan-50 hover:bg-cyan-100",
      icon: Edit3,
      defaultLabel: "Edit",
    },
    delete: {
      style: "text-red-700 bg-red-50 hover:bg-red-100",
      icon: Trash2,
      defaultLabel: "Delete",
    },
  };

  const { style, icon: Icon, defaultLabel } = config[variant] || config.edit;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition ${style} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 mr-1" />
      {label || defaultLabel}
    </button>
  );
};

export default ActionButton;
