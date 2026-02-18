// src/components/ui/PageHeader.jsx
import React from "react";

/**
 * Reusable page header with title, subtitle, and action buttons
 *
 * @param {string} title - Page title
 * @param {string} subtitle - Page subtitle/description
 * @param {React.ReactNode} actions - Action buttons (right side)
 * @param {string} className - Additional classes
 */
const PageHeader = ({ title, subtitle, actions, className = "" }) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
