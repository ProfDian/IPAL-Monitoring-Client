// src/pages/Alerts.jsx
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Filter,
  RefreshCw,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { acknowledgeAlert, resolveAlert } from "../services/alertServices";
import AlertGroupList from "../components/alerts/AlertGroupList";
import { useAlertsData } from "../hooks/useQueryHooks";
import { LoadingScreen, StatCard } from "../components/ui";
import { useRealtimeAlerts } from "../hooks/useRealtimeAlerts";
import { useAlertCount } from "../hooks/useAlertCount";
import { useIPAL } from "../context/IPALContext";

const Alerts = () => {
  // ⭐ USE IPAL CONTEXT - Dynamic IPAL ID
  const { currentIpalId } = useIPAL();

  // ⚡ FIRESTORE REAL-TIME - ALL alerts with auto-update
  const {
    activeAlerts: realtimeAlerts,
    isListening,
    error: realtimeError,
  } = useRealtimeAlerts(currentIpalId, {
    maxAlerts: 100,
    statusFilter: "all",
    priorityOnly: false,
  });

  // 📊 LIGHTWEIGHT - Total counts (FREE - no document reads!)
  const {
    total: totalAlertCount,
    active: activeAlertCount,
    critical: criticalAlertCount,
  } = useAlertCount(currentIpalId);

  // 🆕 REACT QUERY - Only for stats (optional)
  const {
    stats,
    isLoading: statsLoading,
    error: apiError,
    refetch: refreshStats,
  } = useAlertsData(currentIpalId, false);

  // ✅ USE REAL-TIME DATA directly
  const alerts = realtimeAlerts;
  const error = realtimeError || apiError;
  const loading = !isListening && alerts.length === 0;

  // Last update time (for display)
  const [lastUpdate] = useState(new Date());

  // Local state
  const [filter, setFilter] = useState("all");
  const [parameterFilter, setParameterFilter] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Show loading screen on initial connection
  if (loading) {
    return (
      <LoadingScreen
        message="Connecting to real-time alerts..."
        icon={AlertTriangle}
      />
    );
  }

  // Filter alerts locally
  const filteredAlerts = alerts.filter((alert) => {
    const statusMatch = filter === "all" || alert.status === filter;
    const parameterMatch =
      parameterFilter === "all" ||
      alert.parameter?.toLowerCase() === parameterFilter.toLowerCase();
    return statusMatch && parameterMatch;
  });

  // Handle acknowledge all (bulk)
  const handleAcknowledgeAll = async (alertIds) => {
    try {
      // Acknowledge all alerts in parallel
      await Promise.all(alertIds.map((id) => acknowledgeAlert(id)));
      console.log(`✅ Acknowledged ${alertIds.length} alerts`);
      // No need to refresh - Firestore listener will auto-update!
    } catch (error) {
      console.error("❌ Error acknowledging alerts:", error);
      alert("Failed to acknowledge alerts");
    }
  };

  // Handle resolve all (bulk)
  const handleResolveAll = async (alertIds) => {
    try {
      // Resolve all alerts in parallel
      await Promise.all(alertIds.map((id) => resolveAlert(id)));
      console.log(`✅ Resolved ${alertIds.length} alerts`);
      // No need to refresh - Firestore listener will auto-update!
    } catch (error) {
      console.error("❌ Error resolving alerts:", error);
      alert("Failed to resolve alerts");
    }
  };

  // Manual refresh (mostly for stats, real-time data auto-updates)
  const handleRefresh = () => {
    console.log("🔄 Refreshing stats (alerts are already real-time)");
    refreshStats();
  };

  // Calculate resolved count from real-time data
  const resolvedCount = alerts.filter((a) => a.status === "resolved").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Alerts
          </h2>
          {lastUpdate && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center flex-wrap gap-1">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              Last updated: {format(lastUpdate, "HH:mm:ss")}
              {isListening && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  <span className="animate-pulse mr-1">●</span> Live
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex space-x-2">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={statsLoading}
            className="flex items-center px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-100 hover:shadow-md transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 ${statsLoading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh Stats</span>
            <span className="sm:hidden">Refresh</span>
          </button>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-100 hover:shadow-md transition-all"
            >
              <Filter className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
              Filter
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-10">
                {/* Status Filter */}
                <div className="py-2">
                  <p className="px-4 pb-1 text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </p>
                  {["all", "active", "acknowledged", "resolved"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`block w-full text-left px-4 py-2 text-sm rounded-md ${
                        filter === f
                          ? "bg-yellow-100 text-yellow-800 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {f === "all"
                        ? "All"
                        : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Parameter Filter */}
                <div className="py-2">
                  <p className="px-4 pb-1 text-xs font-semibold text-gray-500 uppercase">
                    Parameter
                  </p>
                  {["all", "ph", "temperature", "tds"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setParameterFilter(p)}
                      className={`block w-full text-left px-4 py-2 text-sm rounded-md ${
                        parameterFilter === p
                          ? "bg-yellow-100 text-yellow-800 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {p === "all" ? "All Parameters" : p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">
            ⚠️ Error loading alerts: {error}
          </p>
        </div>
      )}

      {/* Summary Cards - Real-time counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Alerts"
          value={totalAlertCount || alerts.length}
          icon={AlertTriangle}
          color="blue"
          subtitle="All time"
        />
        <StatCard
          label="Active Alerts"
          value={activeAlertCount || alerts.filter((a) => a.status === "active").length}
          icon={AlertTriangle}
          color="orange"
          subtitle={
            isListening ? <span className="text-green-600">● Live</span> : undefined
          }
        />
        <StatCard
          label="Critical"
          value={criticalAlertCount || alerts.filter((a) => a.severity === "critical").length}
          icon={AlertTriangle}
          color="red"
          subtitle="Needs attention"
        />
        <StatCard
          label="Resolved"
          value={resolvedCount}
          icon={CheckCircle}
          color="green"
          subtitle={
            isListening ? <span className="text-green-600">● Live</span> : undefined
          }
        />
      </div>

      {/* ⭐ Alert Group List - Using Real-time Data */}
      <AlertGroupList
        alerts={filteredAlerts}
        loading={loading}
        onAcknowledgeAll={handleAcknowledgeAll}
        onResolveAll={handleResolveAll}
      />
    </div>
  );
};

export default Alerts;
