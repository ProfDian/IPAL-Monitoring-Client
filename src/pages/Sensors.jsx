// src/pages/Sensors.jsx (IMPROVED VERSION)
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MdOutlineSensors,
  MdArrowForward,
  MdRefresh,
  MdCheckCircle,
  MdError,
  MdAccessTime,
  MdWarning,
  MdTrendingUp,
  MdTrendingDown,
} from "react-icons/md";
import sensorService from "../services/sensorServices";
import { LoadingScreen } from "../components/ui";
import { useIPAL } from "../context/IPALContext";
import { getSensorTypeLabel, getSensorUnit } from "../utils/sensorHelpers";

const Sensors = () => {
  // ⭐ USE IPAL CONTEXT - Dynamic IPAL ID
  const { currentIpalId, currentIpal } = useIPAL();

  const [sensors, setSensors] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [offlineCount, setOfflineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (currentIpalId) {
      fetchSensors();
    }
  }, [currentIpalId]);

  const fetchSensors = async () => {
    try {
      setLoading(true);
      const result = await sensorService.getAllSensors({
        ipal_id: currentIpalId,
      });

      // ✅ Extract sensors and counts from result
      setSensors(result.sensors || []);
      setOnlineCount(result.online_count || 0);
      setOfflineCount(result.offline_count || 0);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching sensors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (silent = false) => {
    if (!silent) setRefreshing(true);
    await fetchSensors();
    if (!silent) setRefreshing(false);
  };

  // Group sensors by location
  const groupedSensors = sensors.reduce((acc, sensor) => {
    const location = sensor.sensor_location || "Unknown";
    if (!acc[location]) {
      acc[location] = [];
    }
    acc[location].push(sensor);
    return acc;
  }, {});

  // getSensorTypeLabel and getSensorUnit now imported from utils/sensorHelpers

  // ========================================
  // NEW: Status Badge with Pulse Animation
  // ========================================
  const SensorStatusBadge = ({ sensor }) => {
    // ✅ USE online_status from backend (already calculated)
    const isOnline = sensor.online_status === "online";
    const isWarning = false; // Could be enhanced later

    const formatLastSeen = (timestamp) => {
      if (!timestamp) return "No data";

      // Handle Firestore Timestamp object
      let date;
      try {
        if (timestamp?.toDate) {
          date = timestamp.toDate();
        } else if (timestamp?.seconds) {
          date = new Date(timestamp.seconds * 1000);
        } else if (
          typeof timestamp === "string" ||
          typeof timestamp === "number"
        ) {
          date = new Date(timestamp);
        } else {
          return "No data";
        }

        if (isNaN(date.getTime())) return "No data";
      } catch (error) {
        console.warn("Error parsing timestamp:", timestamp, error);
        return "No data";
      }

      const diff = new Date() - date;
      const minutes = Math.floor(diff / 60000);

      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    };

    return (
      <div className="flex items-center justify-between w-full text-xs">
        <div className="flex items-center space-x-2">
          {/* Pulse animation */}
          <div className="relative">
            <div
              className={`h-2 w-2 rounded-full ${
                isOnline
                  ? "bg-green-500"
                  : isWarning
                    ? "bg-yellow-500"
                    : "bg-gray-300"
              }`}
            ></div>
            {isOnline && (
              <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping opacity-75"></div>
            )}
          </div>
          <span
            className={`font-medium ${
              isOnline
                ? "text-green-700"
                : isWarning
                  ? "text-yellow-700"
                  : "text-gray-500"
            }`}
          >
            {isOnline ? "Online" : isWarning ? "Warning" : "Offline"}
          </span>
        </div>
        <span className="text-gray-500">
          {sensor.latest_reading
            ? formatLastSeen(sensor.latest_reading.timestamp)
            : "No data"}
        </span>
      </div>
    );
  };

  // ========================================
  // NEW: Threshold Warning
  // ========================================
  const ThresholdWarning = ({ value, sensorType }) => {
    if (!value) return null;

    const thresholds = {
      ph: { min: 6, max: 9, label: "6-9" },
      tds: { max: 4000, label: "\u2264 4000 mg/L" },
      temperature: { max: 40, label: "\u2264 40\u00b0C" },
    };

    const threshold = thresholds[sensorType];
    if (!threshold) return null;

    const isAboveMax = threshold.max && value > threshold.max;
    const isBelowMin = threshold.min && value < threshold.min;

    if (!isAboveMax && !isBelowMin) {
      return (
        <div className="flex items-center text-green-600 text-xs mt-1">
          <MdCheckCircle className="mr-1" /> Normal
        </div>
      );
    }

    return (
      <div className="flex items-center text-red-600 text-xs mt-1">
        <MdWarning className="mr-1" />
        {isAboveMax ? "Above" : "Below"} threshold!
      </div>
    );
  };

  // ========================================
  // NEW: Mini Sparkline Chart
  // ========================================
  const MiniSparkline = ({ data, color = "#3b82f6" }) => {
    if (!data || data.length < 2) return null;

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    // Generate SVG path
    const points = values.map((val, idx) => {
      const x = (idx / (values.length - 1)) * 100;
      const y = 100 - ((val - min) / range) * 100;
      return `${x},${y}`;
    });

    return (
      <div className="h-12 -mx-3 -mb-3 overflow-hidden rounded-b-lg bg-gradient-to-t from-gray-50 to-transparent">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    );
  };

  // ========================================
  // NEW: Trend Indicator
  // ========================================
  const TrendIndicator = ({ history }) => {
    if (!history || history.length < 2) return null;

    const current = history[0]?.value;
    const previous = history[1]?.value;

    if (!current || !previous) return null;

    const change = ((current - previous) / previous) * 100;
    const isIncrease = change > 0;

    if (Math.abs(change) < 0.1) return null; // No significant change

    return (
      <div
        className={`flex items-center text-xs ${
          isIncrease ? "text-orange-600" : "text-blue-600"
        }`}
      >
        {isIncrease ? (
          <MdTrendingUp className="mr-1" />
        ) : (
          <MdTrendingDown className="mr-1" />
        )}
        <span>{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading Sensors" icon={MdOutlineSensors} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary-100 rounded-lg">
            <MdOutlineSensors className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Sensor Management
            </h2>
            <p className="text-sm text-gray-500">
              Monitor all sensors in IPAL UNDIP • Last update:{" "}
              {lastRefresh.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleRefresh(false)}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
        >
          <MdRefresh className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Sensors</p>
              <p className="text-2xl font-bold text-gray-900">
                {sensors.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <MdOutlineSensors className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Online</p>
              <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <MdCheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inlet Sensors</p>
              <p className="text-2xl font-bold text-gray-900">
                {sensors.filter((s) => s.sensor_location === "inlet").length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <MdArrowForward className="h-6 w-6 text-purple-600 rotate-180" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Outlet Sensors</p>
              <p className="text-2xl font-bold text-gray-900">
                {sensors.filter((s) => s.sensor_location === "outlet").length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <MdArrowForward className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Sensors Grid - Grouped by Location */}
      {Object.entries(groupedSensors).map(([location, locationSensors]) => (
        <div key={location} className="space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900 capitalize">
              {location}
            </h3>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              {locationSensors.length} sensors
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {locationSensors.map((sensor) => {
              const unit = getSensorUnit(sensor.sensor_type);
              const sparklineColor =
                sensor.sensor_location === "inlet" ? "#8b5cf6" : "#f97316";

              return (
                <Link
                  key={sensor.id}
                  to={`/sensors/${sensor.id}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all group overflow-hidden"
                >
                  <div className="p-5 pb-3">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition">
                          {getSensorTypeLabel(sensor.sensor_type)}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 capitalize">
                          {sensor.sensor_location}
                        </p>
                      </div>
                      <TrendIndicator history={sensor.mini_history} />
                    </div>

                    {/* Latest Reading */}
                    {sensor.latest_reading ? (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 mb-3">
                        <p className="text-xs text-gray-500 mb-1">
                          Latest Value
                        </p>
                        <div className="flex items-end justify-between">
                          <p className="text-2xl font-bold text-gray-900">
                            {sensor.latest_reading.value}
                            <span className="text-sm font-normal text-gray-500 ml-1">
                              {unit}
                            </span>
                          </p>
                        </div>
                        <ThresholdWarning
                          value={sensor.latest_reading.value}
                          sensorType={sensor.sensor_type}
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-400 text-center">
                          No data available
                        </p>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="mb-3">
                      <SensorStatusBadge sensor={sensor} />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                      <span className="text-gray-500 flex items-center">
                        <MdAccessTime className="mr-1" />
                        {sensor.latest_reading
                          ? (() => {
                              try {
                                let date;
                                const ts = sensor.latest_reading.timestamp;
                                if (ts?.toDate) {
                                  date = ts.toDate();
                                } else if (ts?.seconds) {
                                  date = new Date(ts.seconds * 1000);
                                } else {
                                  date = new Date(ts);
                                }
                                return date.toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                });
                              } catch {
                                return "No data";
                              }
                            })()
                          : "No data"}
                      </span>
                      <span className="text-primary-600 group-hover:underline flex items-center font-medium">
                        View Details
                        <MdArrowForward className="ml-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {sensors.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <MdError className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Sensors Found
          </h3>
          <p className="text-gray-500 mb-6">
            There are no sensors configured for this IPAL.
          </p>
        </div>
      )}
    </div>
  );
};

export default Sensors;
