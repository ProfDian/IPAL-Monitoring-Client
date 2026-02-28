/**
 * ========================================
 * QUALITY SCORE CHART COMPONENT
 * ========================================
 * Lokasi: src/components/charts/QualityScoreChart.jsx
 *
 * Chart untuk menampilkan Quality Score over time
 * dengan color-coding berdasarkan status (excellent/good/fair/poor/critical)
 *
 * Features:
 * - Line chart dengan custom dots (color by status)
 * - Custom tooltip dengan violations info
 * - Reference lines untuk thresholds
 * - Responsive design
 */

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  getQualityHexMap,
  getQualityHex,
  QUALITY_STATUS,
  QUALITY_THRESHOLDS,
} from "../../utils/statusConfig";

const QualityScoreChart = ({ data = [], height = 400 }) => {
  // Status color mapping — from centralized config
  const statusColors = getQualityHexMap();

  /**
   * Custom Tooltip dengan detail violations
   */
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null;

    const item = payload[0].payload;

    return (
      <div className="bg-white p-4 rounded-xl shadow-2xl border-2 border-gray-200 max-w-sm">
        {/* Timestamp */}
        <div className="border-b pb-2 mb-2">
          <p className="font-bold text-gray-900 text-sm">
            📅 {item.date} • {item.time}
          </p>
        </div>

        {/* Quality Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Quality Score:</span>
            <span className="text-lg font-bold text-gray-900">
              {item.quality_score}/100
            </span>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold capitalize"
              style={{
                backgroundColor: statusColors[item.status] + "30",
                color: statusColors[item.status],
                border: `2px solid ${statusColors[item.status]}`,
              }}
            >
              {item.status}
            </span>
          </div>

          {/* Violations */}
          {item.has_violations && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-red-600 mb-1">
                ⚠️ {item.violations?.length || item.alert_count} Violation(s)
              </p>
              {item.violations && item.violations.length > 0 && (
                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                  {item.violations.slice(0, 3).map((v, idx) => (
                    <li key={idx} className="list-disc">
                      {v.parameter.toUpperCase()}: {v.value} (max: {v.threshold}
                      )
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* No Violations */}
          {!item.has_violations && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-green-600 font-semibold">
                ✓ No violations
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Custom Dot dengan color berdasarkan status
   */
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;

    if (!payload) return null;

    const color = statusColors[payload.status] || "#999";
    const isViolation = payload.has_violations;

    return (
      <g>
        {/* Outer ring untuk violations */}
        {isViolation && (
          <circle
            cx={cx}
            cy={cy}
            r={10}
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={0.3}
          />
        )}

        {/* Main dot */}
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill={color}
          stroke="white"
          strokeWidth={2}
          style={{
            cursor: "pointer",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
          }}
        />
      </g>
    );
  };

  /**
   * Custom Legend
   */
  const CustomLegend = () => (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs">
      {QUALITY_THRESHOLDS.map(({ min, status }) => (
        <div key={status} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: statusColors[status] }}
          ></div>
          <span className="text-gray-600 capitalize">
            {QUALITY_STATUS[status].label} (
            {status === "critical"
              ? `<${QUALITY_THRESHOLDS[QUALITY_THRESHOLDS.length - 2].min}`
              : `${min}+`}
            )
          </span>
        </div>
      ))}
    </div>
  );

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-gray-600 font-semibold mb-1">No Data Available</p>
          <p className="text-sm text-gray-500">
            Data will appear after sensor readings are collected
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="time"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            stroke="#9ca3af"
          />

          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            stroke="#9ca3af"
            label={{
              value: "Quality Score",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12, fill: "#6b7280" },
            }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Reference Lines untuk Thresholds */}
          <ReferenceLine
            y={85}
            stroke={statusColors.excellent}
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{
              value: "Excellent",
              position: "right",
              fontSize: 10,
              fill: statusColors.excellent,
            }}
          />
          <ReferenceLine
            y={70}
            stroke={statusColors.good}
            strokeDasharray="5 5"
            strokeWidth={1}
            label={{
              value: "Good",
              position: "right",
              fontSize: 10,
              fill: statusColors.good,
            }}
          />
          <ReferenceLine
            y={50}
            stroke={statusColors.fair}
            strokeDasharray="5 5"
            strokeWidth={1}
            label={{
              value: "Fair",
              position: "right",
              fontSize: 10,
              fill: statusColors.fair,
            }}
          />
          <ReferenceLine
            y={30}
            stroke={statusColors.poor}
            strokeDasharray="5 5"
            strokeWidth={1}
            label={{
              value: "Poor",
              position: "right",
              fontSize: 10,
              fill: statusColors.poor,
            }}
          />

          {/* Main Line */}
          <Line
            type="monotone"
            dataKey="quality_score"
            stroke="#8884d8"
            strokeWidth={3}
            dot={<CustomDot />}
            name="Quality Score"
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Custom Legend */}
      <CustomLegend />
    </div>
  );
};

export default QualityScoreChart;
