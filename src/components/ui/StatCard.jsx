// src/components/ui/StatCard.jsx
import React from "react";

/**
 * Reusable stats card component for summary numbers
 *
 * @param {string} label - Stat label text
 * @param {string|number} value - Stat value
 * @param {React.ComponentType} icon - Lucide/react-icons icon
 * @param {string} color - Color key: "blue", "orange", "red", "green", "cyan", "yellow"
 * @param {string} subtitle - Small text below value
 * @param {string} className - Additional classes
 */
const StatCard = ({
  label,
  value,
  icon: Icon,
  color = "blue",
  subtitle,
  className = "",
}) => {
  const colorMap = {
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    orange: { bg: "bg-orange-100", text: "text-orange-600" },
    red: { bg: "bg-red-100", text: "text-red-600" },
    green: { bg: "bg-green-100", text: "text-green-600" },
    cyan: { bg: "bg-cyan-100", text: "text-cyan-600" },
    yellow: { bg: "bg-yellow-100", text: "text-yellow-600" },
  };

  const { bg, text } = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`bg-white shadow-md hover:shadow-lg transition rounded-2xl p-4 flex items-center ${className}`}
    >
      {Icon && (
        <div className={`flex-shrink-0 rounded-full ${bg} p-4`}>
          <Icon className={`h-7 w-7 ${text}`} />
        </div>
      )}
      <div className={Icon ? "ml-4" : ""}>
        <h3 className="text-sm font-medium text-gray-500">{label}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
