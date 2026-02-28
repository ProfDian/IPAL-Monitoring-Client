// src/pages/SensorDetail.jsx (IMPROVED VERSION)
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MdArrowBack,
  MdOutlineHistory,
  MdCheckCircle,
  MdError,
  MdAccessTime,
  MdCalendarToday,
  MdRefresh,
  MdDownload,
  MdTrendingUp,
  MdTrendingDown,
  MdWarning,
  MdInfoOutline,
} from "react-icons/md";
import sensorService from "../services/sensorServices";
import LineChart from "../components/charts/LineChart";
import { LoadingScreen } from "../components/ui";
import { getSensorTypeLabel, getSensorUnit } from "../utils/sensorHelpers";

const SensorDetail = () => {
  const { id } = useParams();
  const [sensor, setSensor] = useState(null);
  const [latestReading, setLatestReading] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [historyLimit, setHistoryLimit] = useState(100);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchSensorData();
  }, [id]);

  const fetchSensorData = async () => {
    try {
      setLoading(true);

      // Fetch sensor metadata
      const sensorData = await sensorService.getSensorById(id);
      console.log("🔍 Sensor data:", sensorData);
      setSensor(sensorData);

      // Fetch latest reading
      try {
        const latestData = await sensorService.getSensorLatestReading(id);
        console.log("🔍 Latest reading response:", latestData);
        setLatestReading(latestData?.latest_reading || null);
      } catch (error) {
        console.warn("No latest reading available:", error);
        setLatestReading(null);
      }

      // Fetch history
      try {
        const historyData = await sensorService.getSensorHistory(id, {
          limit: historyLimit,
        });
        console.log("🔍 History response:", historyData);
        const historyArray = historyData?.history || [];
        setHistory(historyArray);

        // Calculate statistics
        if (historyArray.length > 0) {
          calculateStatistics(historyArray);
        }
      } catch (error) {
        console.warn("No history available:", error);
        setHistory([]);
      }
    } catch (error) {
      console.error("❌ Error fetching sensor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchSensorData();
  };

  // ========================================
  // NEW: Calculate Statistics
  // ========================================
  const calculateStatistics = (data) => {
    const values = data.map((d) => d.value).filter((v) => v !== null);

    if (values.length === 0) {
      setStats(null);
      return;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    setStats({
      min: min.toFixed(2),
      max: max.toFixed(2),
      avg: avg.toFixed(2),
      count: values.length,
    });
  };

  // ========================================
  // NEW: Trend Indicator
  // ========================================
  const TrendIndicator = ({ current, history }) => {
    if (!history || history.length < 2) return null;

    const previous = history[1]?.value || current;
    if (!previous || previous === current) return null;

    const change = ((current - previous) / previous) * 100;
    const isIncrease = current > previous;

    return (
      <div
        className={`flex items-center text-sm mt-2 ${
          isIncrease ? "text-orange-600" : "text-blue-600"
        }`}
      >
        {isIncrease ? (
          <MdTrendingUp className="mr-1 h-5 w-5" />
        ) : (
          <MdTrendingDown className="mr-1 h-5 w-5" />
        )}
        <span className="font-medium">
          {Math.abs(change).toFixed(1)}% from previous
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
      ph: { min: 6, max: 9, label: "Normal range: 6-9" },
      tds: { max: 4000, label: "Max threshold: 4000 mg/L" },
      temperature: { max: 40, label: "Max threshold: 40\u00b0C" },
    };

    const threshold = thresholds[sensorType];
    if (!threshold) return null;

    const isAboveMax = threshold.max && value > threshold.max;
    const isBelowMin = threshold.min && value < threshold.min;

    if (!isAboveMax && !isBelowMin) {
      return (
        <div className="flex items-center text-green-600 text-sm mt-3 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
          <MdCheckCircle className="mr-2 h-5 w-5" />
          <span>Within normal range • {threshold.label}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center text-red-600 text-sm mt-3 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
        <MdWarning className="mr-2 h-5 w-5" />
        <span>
          {isAboveMax ? "Above" : "Below"} threshold! • {threshold.label}
        </span>
      </div>
    );
  };

  // ========================================
  // NEW: Export to CSV
  // ========================================
  const exportToCSV = () => {
    if (history.length === 0) {
      alert("No data to export");
      return;
    }

    const unit = getSensorUnit(sensor.sensor_type);
    const csvContent = [
      ["Timestamp", "Value", "Unit", "Reading ID"],
      ...history.map((h) => [
        new Date(h.timestamp).toLocaleString("id-ID"),
        h.value,
        unit,
        h.reading_id,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sensor-${sensor.sensor_type}-${
      sensor.sensor_location
    }-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // getSensorTypeLabel and getSensorUnit imported from utils/sensorHelpers

  const getStatusBadge = (status) => {
    if (status === "active") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <MdCheckCircle className="mr-1" /> Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
        <MdError className="mr-1" /> Inactive
      </span>
    );
  };

  if (loading) {
    return (
      <LoadingScreen message="Loading Sensor Details" icon={MdOutlineHistory} />
    );
  }

  if (!sensor) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <MdError className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-gray-900 mb-2">
          Sensor Not Found
        </h2>
        <p className="text-gray-500 mb-6">
          The sensor with ID "{id}" could not be found.
        </p>
        <Link
          to="/sensors"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
        >
          <MdArrowBack className="mr-1" /> Back to Sensors
        </Link>
      </div>
    );
  }

  const unit = getSensorUnit(sensor.sensor_type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4 sm:p-6 border border-primary-200">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0">
            <Link
              to="/sensors"
              className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50 shadow-sm transition flex-shrink-0"
            >
              <MdArrowBack className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {getSensorTypeLabel(sensor.sensor_type)}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                {sensor.sensor_description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {getStatusBadge(sensor.status)}
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50 shadow-sm transition"
            >
              <MdRefresh className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white rounded-t-lg">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 px-3 sm:px-6 overflow-x-auto">
          {["overview", "statistics", "history", "info"].map((tab) => (
            <button
              key={tab}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all capitalize ${
                activeTab === tab
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="p-6 space-y-6">
            {/* Latest Reading Card */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Current Reading
              </h3>

              {latestReading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Value Card */}
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 border border-primary-200">
                    <div className="text-sm text-gray-600 mb-2">
                      Current Value
                    </div>
                    <div className="text-4xl font-bold text-gray-900">
                      {latestReading.value}
                      <span className="text-xl font-normal text-gray-600 ml-2">
                        {unit}
                      </span>
                    </div>

                    {/* Trend Indicator */}
                    <TrendIndicator
                      current={latestReading.value}
                      history={history}
                    />

                    <div className="mt-4 flex items-center text-sm text-gray-600">
                      <MdAccessTime className="mr-1" />
                      {new Date(latestReading.timestamp).toLocaleString(
                        "id-ID",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                      )}
                    </div>

                    {/* Threshold Warning */}
                    <ThresholdWarning
                      value={latestReading.value}
                      sensorType={sensor.sensor_type}
                    />
                  </div>

                  {/* Sensor Info */}
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Sensor Type</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {getSensorTypeLabel(sensor.sensor_type)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {sensor.sensor_location}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {sensor.status}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">
                        Total Readings
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {sensor.readings_count ?? history.length}
                      </p>
                      {sensor.readings_count > history.length && (
                        <p className="text-xs text-gray-400 mt-1">
                          {history.length}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
                  <MdError className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No current data available for this sensor
                  </p>
                </div>
              )}
            </div>

            {/* Recent History Chart */}
            {history.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Trend (Last 24 Readings)
                </h3>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <LineChart
                    data={history.slice(0, 24).reverse()}
                    dataKey="value"
                    name={getSensorTypeLabel(sensor.sensor_type)}
                    unit={unit}
                    color="#3b82f6"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* NEW: STATISTICS TAB */}
        {activeTab === "statistics" && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Statistical Analysis
              </h3>
              <span className="text-sm text-gray-500">
                Based on {stats?.count || 0} of{" "}
                {sensor?.readings_count ?? stats?.count ?? 0} readings
              </span>
            </div>

            {stats ? (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium mb-2">
                      MINIMUM
                    </p>
                    <p className="text-3xl font-bold text-blue-900">
                      {stats.min}
                      <span className="text-lg font-normal text-blue-700 ml-2">
                        {unit}
                      </span>
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
                    <p className="text-xs text-red-600 font-medium mb-2">
                      MAXIMUM
                    </p>
                    <p className="text-3xl font-bold text-red-900">
                      {stats.max}
                      <span className="text-lg font-normal text-red-700 ml-2">
                        {unit}
                      </span>
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <p className="text-xs text-green-600 font-medium mb-2">
                      AVERAGE
                    </p>
                    <p className="text-3xl font-bold text-green-900">
                      {stats.avg}
                      <span className="text-lg font-normal text-green-700 ml-2">
                        {unit}
                      </span>
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                    <p className="text-xs text-purple-600 font-medium mb-2">
                      RANGE
                    </p>
                    <p className="text-3xl font-bold text-purple-900">
                      {(stats.max - stats.min).toFixed(2)}
                      <span className="text-lg font-normal text-purple-700 ml-2">
                        {unit}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Full History Chart */}
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4">
                    Complete Data Visualization
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <LineChart
                      data={history.slice().reverse()}
                      dataKey="value"
                      name={getSensorTypeLabel(sensor.sensor_type)}
                      unit={unit}
                      color="#3b82f6"
                    />
                  </div>
                </div>

                {/* Threshold Info */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-start">
                  <MdInfoOutline className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      About Thresholds
                    </p>
                    <p className="text-sm text-blue-700">
                      {sensor.sensor_type === "ph" &&
                        "pH normal range: 6-9. Values outside this range may indicate water quality issues."}
                      {sensor.sensor_type === "tds" &&
                        "TDS should be below 4000 mg/L based on government standards (Baku Mutu Pemerintah)."}
                      {sensor.sensor_type === "temperature" &&
                        "Temperature should be below 40\u00b0C based on government standards (Baku Mutu Pemerintah)."}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
                <MdError className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Not enough data to calculate statistics
                </p>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Historical Data
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
                >
                  <MdDownload className="mr-2" /> Export CSV
                </button>
                <select
                  value={historyLimit}
                  onChange={(e) => {
                    setHistoryLimit(Number(e.target.value));
                    fetchSensorData();
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value={50}>Last 50</option>
                  <option value={100}>Last 100</option>
                  <option value={200}>Last 200</option>
                  <option value={500}>Last 500</option>
                </select>
              </div>
            </div>

            {history.length > 0 ? (
              <>
                {/* Chart */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <LineChart
                    data={history.slice().reverse()}
                    dataKey="value"
                    name={getSensorTypeLabel(sensor.sensor_type)}
                    unit={unit}
                    color="#3b82f6"
                  />
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reading ID
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.map((item, idx) => {
                        const thresholds = {
                          ph: { min: 6, max: 9 },
                          tds: { max: 4000 },
                          temperature: { max: 40 },
                        };
                        const threshold = thresholds[sensor.sensor_type];
                        const isNormal = threshold
                          ? (!threshold.min || item.value >= threshold.min) &&
                            (!threshold.max || item.value <= threshold.max)
                          : true;

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {idx + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <MdCalendarToday className="mr-2 text-gray-400" />
                                {new Date(item.timestamp).toLocaleString(
                                  "id-ID",
                                  {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                    timeZone: "Asia/Jakarta",
                                  },
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.value} {unit}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {isNormal ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <MdCheckCircle className="mr-1" /> Normal
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <MdWarning className="mr-1" /> Alert
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {item.reading_id.substring(0, 12)}...
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
                <MdError className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No historical data available for this sensor
                </p>
              </div>
            )}
          </div>
        )}

        {/* INFO TAB */}
        {activeTab === "info" && (
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sensor Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Sensor ID</p>
                  <p className="text-sm font-mono font-medium text-gray-900">
                    {sensor.id}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Sensor Type</p>
                  <p className="text-sm font-medium text-gray-900">
                    {getSensorTypeLabel(sensor.sensor_type)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {sensor.sensor_location}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {sensor.status}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm font-medium text-gray-900">
                    {sensor.sensor_description}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Added By</p>
                  <p className="text-sm font-medium text-gray-900">
                    {sensor.added_by || "System"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Added At</p>
                  <p className="text-sm font-medium text-gray-900">
                    {sensor.added_at
                      ? new Date(sensor.added_at).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "N/A"}
                  </p>
                </div>

                {sensor.last_calibration && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">
                      Last Calibration
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(sensor.last_calibration).toLocaleString(
                        "id-ID",
                        {
                          dateStyle: "medium",
                        },
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorDetail;
