// src/components/charts/LineChart.jsx
// 🔥 IMPROVED VERSION - Clean, Flexible, Auto-formatting

import React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

/**
 * 🎨 Modern Line Chart Component
 *
 * Features:
 * - Auto-detect timestamp format (ISO string or object with time/date)
 * - Smart axis formatting based on data range
 * - Custom tooltips with better UX
 * - Multiple line support
 * - Reference lines for thresholds
 * - Responsive and accessible
 *
 * @param {Array} data - Array of data objects
 * @param {String|Array} dataKey - Single key or array of keys for multiple lines
 * @param {String|Array} name - Display name(s) for the line(s)
 * @param {String|Array} color - Color(s) for the line(s)
 * @param {String} unit - Unit to display (e.g., "°C", "ppm", "NTU")
 * @param {Number} height - Chart height in pixels (default: 300)
 * @param {Object} thresholds - Optional threshold lines { label, value, color }
 * @param {Boolean} showLegend - Show/hide legend (default: true)
 * @param {Boolean} showGrid - Show/hide grid (default: true)
 */
const LineChart = ({
  data = [],
  dataKey,
  name,
  color = "#3b82f6",
  unit = "",
  height = 300,
  thresholds = [],
  showLegend = true,
  showGrid = true,
  xAxisKey = "timestamp",
}) => {
  // ========================================
  // DATA VALIDATION
  // ========================================

  if (!data || data.length === 0) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        style={{ height: `${height}px` }}
      >
        <div className="text-4xl mb-2">📊</div>
        <p className="font-medium">No Data Available</p>
        <p className="text-sm text-gray-400 mt-1">
          Data will appear after readings are collected
        </p>
      </div>
    );
  }

  // ========================================
  // MULTI-LINE SUPPORT
  // ========================================

  // Convert single line to array format for consistency
  const lines = Array.isArray(dataKey)
    ? dataKey.map((key, idx) => ({
        dataKey: key,
        name: Array.isArray(name) ? name[idx] : `${name} ${idx + 1}`,
        color: Array.isArray(color) ? color[idx] : color,
      }))
    : [{ dataKey, name, color }];

  // ========================================
  // TIME FORMATTING
  // ========================================

  /**
   * Smart X-axis formatter
   * Detects data structure and formats accordingly
   */
  const formatXAxis = (value, index) => {
    if (!value) return "";

    // If data has display fields, use them (but re-format to ensure consistency)
    if (data[index]?.time_display || data[index]?.date_display) {
      // Use display fields but validate they're proper
      const timeSpan = getDataTimeSpan(data);
      if (timeSpan > 24 * 60 * 60 * 1000) {
        // More than 1 day - show date
        return data[index].date_display || "";
      } else {
        // Same day - show time
        return data[index].time_display || "";
      }
    }

    // Parse ISO timestamp
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date in formatXAxis:", value);
        return "";
      }

      // If data spans multiple days, show date + time
      const timeSpan = getDataTimeSpan(data);
      if (timeSpan > 24 * 60 * 60 * 1000) {
        // More than 1 day
        return date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          timeZone: "Asia/Jakarta",
        });
      } else {
        // Same day, show time only
        return date.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Jakarta",
        });
      }
    } catch (error) {
      console.error("Error formatting X-axis:", error, value);
      return String(value).substring(0, 10);
    }
  };

  /**
   * Calculate time span of dataset
   */
  const getDataTimeSpan = (data) => {
    if (!data || data.length === 0) return 0;

    try {
      const timestamps = data
        .map((d) => new Date(d[xAxisKey] || d.timestamp).getTime())
        .filter((t) => !isNaN(t));

      if (timestamps.length === 0) return 0;

      return Math.max(...timestamps) - Math.min(...timestamps);
    } catch (error) {
      return 0;
    }
  };

  /**
   * Custom Tooltip with better formatting
   */
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const formatTooltipValue = (value) => {
      if (value == null) return "N/A";

      const numericValue =
        typeof value === "number"
          ? value
          : typeof value === "string"
            ? Number(value)
            : NaN;

      if (Number.isFinite(numericValue)) {
        return numericValue.toFixed(2);
      }

      return String(value);
    };

    // Format timestamp for tooltip
    let formattedTime = label;
    try {
      const date = new Date(label);
      if (!isNaN(date.getTime())) {
        formattedTime = date.toLocaleString("id-ID", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Jakarta",
        });
      }
    } catch (error) {
      console.error("Error formatting tooltip time:", error);
      // Keep original label if parsing fails
    }

    return (
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-200">
        <p className="text-xs text-gray-600 mb-2 font-medium font-mono">
          {formattedTime}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {entry.name}:
                </span>
              </div>
              <span
                className="text-sm font-bold font-mono"
                style={{ color: entry.color }}
              >
                {formatTooltipValue(entry.value)}
                {unit && ` ${unit}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Custom Y-axis tick formatter
   */
  const formatYAxis = (value) => {
    if (value == null) return "";

    // If value is very large, use K/M notation
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M${unit ? ` ${unit}` : ""}`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}K${unit ? ` ${unit}` : ""}`;
    }

    return `${value}${unit ? ` ${unit}` : ""}`;
  };

  // ========================================
  // CALCULATE Y-AXIS DOMAIN
  // ========================================

  const getYAxisDomain = () => {
    try {
      const allValues = data.flatMap((item) =>
        lines.map((line) => item[line.dataKey]).filter((v) => v != null),
      );

      if (allValues.length === 0) return ["auto", "auto"];

      const min = Math.min(...allValues);
      const max = Math.max(...allValues);
      const padding = (max - min) * 0.1; // 10% padding

      return [
        Math.max(0, min - padding), // Don't go below 0 for most sensors
        max + padding,
      ];
    } catch (error) {
      return ["auto", "auto"];
    }
  };

  // ========================================
  // RENDER CHART
  // ========================================

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          {/* Grid */}
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              opacity={0.5}
            />
          )}

          {/* X Axis */}
          <XAxis
            dataKey={xAxisKey}
            tickFormatter={formatXAxis}
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tickMargin={8}
            minTickGap={30}
          />

          {/* Y Axis */}
          <YAxis
            tickFormatter={formatYAxis}
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            domain={getYAxisDomain()}
            tickMargin={8}
          />

          {/* Tooltip */}
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ strokeDasharray: "3 3" }}
          />

          {/* Legend */}
          {showLegend && <Legend wrapperStyle={{ paddingTop: "10px" }} />}

          {/* Reference Lines (Thresholds) */}
          {thresholds.map((threshold, idx) => (
            <ReferenceLine
              key={idx}
              y={threshold.value}
              label={{
                value: threshold.label,
                position: "right",
                style: { fontSize: "11px", fill: threshold.color || "#9ca3af" },
              }}
              stroke={threshold.color || "#9ca3af"}
              strokeDasharray="5 5"
              opacity={0.6}
            />
          ))}

          {/* Lines */}
          {lines.map((line, idx) => (
            <Line
              key={idx}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2.5}
              dot={{
                r: 3,
                fill: line.color,
                strokeWidth: 0,
              }}
              activeDot={{
                r: 6,
                fill: line.color,
                stroke: "#fff",
                strokeWidth: 2,
              }}
              connectNulls // Connect line even if some points are null
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>

      {/* Data Info */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div>
          <span className="font-medium text-gray-700 font-mono">
            {data.length}
          </span>{" "}
          data points
        </div>
        {data.length > 0 &&
          data[0][xAxisKey] &&
          data[data.length - 1][xAxisKey] && (
            <div className="font-mono">
              {(() => {
                try {
                  const start = new Date(data[0][xAxisKey]);
                  const end = new Date(data[data.length - 1][xAxisKey]);
                  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    return `${start.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })} - ${end.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}`;
                  }
                  return "";
                } catch (e) {
                  return "";
                }
              })()}
            </div>
          )}
      </div>
    </div>
  );
};

export default LineChart;

/**
 * ========================================
 * USAGE EXAMPLES
 * ========================================
 *
 * 1. BASIC USAGE (Single Line):
 *
 * <LineChart
 *   data={readings}
 *   dataKey="ph"
 *   name="pH Level"
 *   color="#3b82f6"
 *   unit=""
 * />
 *
 *
 * 2. MULTIPLE LINES (Inlet vs Outlet):
 *
 * <LineChart
 *   data={readings}
 *   dataKey={["inlet_ph", "outlet_ph"]}
 *   name={["Inlet pH", "Outlet pH"]}
 *   color={["#3b82f6", "#10b981"]}
 *   unit=""
 * />
 *
 *
 * 3. WITH THRESHOLDS:
 *
 * <LineChart
 *   data={readings}
 *   dataKey="tds"
 *   name="TDS"
 *   color="#8b5cf6"
 *   unit="ppm"
 *   thresholds={[
 *     { label: "Max Limit", value: 500, color: "#ef4444" },
 *     { label: "Target", value: 250, color: "#10b981" }
 *   ]}
 * />
 *
 *
 * 4. CUSTOM HEIGHT & NO LEGEND:
 *
 * <LineChart
 *   data={readings}
 *   dataKey="temperature"
 *   name="Temperature"
 *   color="#ef4444"
 *   unit="°C"
 *   height={400}
 *   showLegend={false}
 * />
 */
