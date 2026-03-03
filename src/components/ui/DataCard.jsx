// src/components/ui/DataCard.jsx
import { getStatusColor } from "../../utils/waterQualityStatus";

const DataCard = ({
  title,
  value,
  unit,
  icon: Icon,
  status,
  isActive = true,
}) => {
  const statusColor = isActive
    ? getStatusColor(status)
    : "bg-gray-50 text-gray-400 border-gray-200";

  return (
    <div
      className={`${statusColor} rounded-xl p-4 sm:p-5 border-2 transition-all duration-300 hover:shadow-lg overflow-hidden`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold opacity-90 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-2 truncate">
            {isActive && value !== null && value !== undefined
              ? `${value.toFixed(2)}`
              : "-"}
            {isActive && value !== null && value !== undefined && unit && (
              <span className="text-base sm:text-lg font-semibold ml-0.5">
                {unit}
              </span>
            )}
          </p>
          {isActive && status && (
            <p className="text-xs mt-2 opacity-80 font-semibold truncate">
              {status}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2 sm:p-3 rounded-lg bg-white bg-opacity-60 shadow-sm flex-shrink-0">
            <Icon className="w-6 h-6 sm:w-8 sm:h-8 stroke-[2.5]" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DataCard;
