// src/pages/Dashboard.jsx

import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Droplet,
  Thermometer,
  Waves,
  RefreshCw,
  MapPin,
  Activity,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  AlertTriangle,
  Wrench,
  Info,
  ShieldAlert,
  Lightbulb,
  ExternalLink,
} from "lucide-react";
import { LoadingScreen } from "../components/ui";
import { useIPAL } from "../context/IPALContext";
import { getEntityStatusColor, getSeverityConfig } from "../utils/statusConfig";

// ⚡ Lazy load heavy components (Charts only - Map components eager loaded to prevent reuse error)
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
const LineChart = lazy(() => import("../components/charts/LineChart"));
const QualityScoreChart = lazy(
  () => import("../components/charts/QualityScoreCharts"),
);

// Eager load - Small components
import StatsOverview from "../components/ui/StatsOverview";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import DataCard from "../components/ui/DataCard";

// Utils
import { getParameterStatus } from "../utils/waterQualityStatus";

// Services
import {
  useDashboardSummary,
  useDashboardReadings,
  useSensorReadings,
} from "../hooks/useQueryHooks";

// 🔥 Firestore Real-time Hooks
import { useRealtimeLatestReading } from "../hooks/useRealtimeLatestReading";
import { useAlertCount } from "../hooks/useAlertCount";

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom IPAL logo marker icon
const ipalIcon = L.icon({
  iconUrl: "/LogoIPAL.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});
// ⭐ MapUpdater Component - Outside Dashboard to avoid re-creation
const MapUpdater = ({ location }) => {
  const map = useMap();

  useEffect(() => {
    if (location && map) {
      map.flyTo(location, 18, { duration: 1.2 });
    }
  }, [location, map]);

  return null;
};

// Component to update map position when location changes (moved inside Dashboard to avoid lazy load issues)

const Dashboard = () => {
  const navigate = useNavigate();

  // ⭐ USE IPAL CONTEXT - Dynamic IPAL ID
  const { currentIpalId, currentIpal, isLoading: isIpalLoading } = useIPAL();

  // UI State
  const [selectedPlace, setSelectedPlace] = useState("");
  const [currentParamIndex, setCurrentParamIndex] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  // ⚡ FIRESTORE REAL-TIME LISTENERS - Instant updates!
  const {
    latestReading: realtimeReading,
    qualityScore: realtimeQualityScore,
    status: realtimeStatus,
    violations: realtimeViolations,
    recommendations: realtimeRecommendations,
    isListening: isReadingListening,
  } = useRealtimeLatestReading(currentIpalId);

  // 📊 OPTIMIZED: Get alert counts (Fno document reads!)
  const {
    active: activeAlertCount, // Used in badge display
    critical: criticalAlertCount, // Used in badge display
  } = useAlertCount(currentIpalId);

  // 📊 API CALLS - Historical data (cached)
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardSummary(currentIpalId, {
    enabled: !!currentIpalId, // Only fetch when IPAL ID is available
  });

  const {
    data: qualityChartDataRaw,
    isLoading: isChartLoading,
    refetch: refetchChart,
  } = useDashboardReadings(currentIpalId, {
    period: selectedPeriod,
    limit: selectedPeriod === "today" ? 24 : 50,
    enabled: !!currentIpalId,
    refetchInterval: 60000, // Auto-refresh every 60 seconds
    refetchOnWindowFocus: true, // Refresh when window regains focus
  });

  const {
    data: historicalDataRaw,
    isLoading: isHistoricalLoading,
    refetch: refetchHistorical,
  } = useSensorReadings(
    {
      ipal_id: currentIpalId,
      limit: 24,
      order: "desc",
    },
    {
      enabled: !!selectedPlace && !!currentIpalId, // Hanya fetch jika ada selectedPlace dan IPAL ID
      staleTime: 30000, // 30 seconds - refresh more frequently
      cacheTime: 60000, // 1 minute
      refetchInterval: 60000, // Auto-refresh every 60 seconds
      refetchOnWindowFocus: true, // Refresh when window regains focus
    },
  );

  // Data State (derived from React Query)
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Wait for IPAL to load
  if (isIpalLoading || !currentIpalId) {
    return <LoadingScreen message="Loading IPAL Configuration" icon={MapPin} />;
  }

  // Process data
  // Backend response: { success, count, period, date_range, summary, data: [...] }
  const qualityChartData = qualityChartDataRaw?.data || [];
  const historicalData = historicalDataRaw || [];
  const isLoading = isDashboardLoading || isChartLoading;
  const error = dashboardError; // Locations from IPAL data (lat, lng) with fallback
  const defaultLocations = {
    inlet: [-7.050665024868658, 110.44008189915155],
    outlet: [-7.050193776750058, 110.44035712980384],
  };
  const locations = {
    inlet: currentIpal?.coordinates?.inlet
      ? [currentIpal.coordinates.inlet.lat, currentIpal.coordinates.inlet.lng]
      : defaultLocations.inlet,
    outlet: currentIpal?.coordinates?.outlet
      ? [currentIpal.coordinates.outlet.lat, currentIpal.coordinates.outlet.lng]
      : defaultLocations.outlet,
  };
  const mapCenter = [
    (locations.inlet[0] + locations.outlet[0]) / 2,
    (locations.inlet[1] + locations.outlet[1]) / 2,
  ];

  // Parameters configuration
  const parameters = [
    { name: "pH", key: "ph", unit: "", icon: Droplet, color: "#3b82f6" },
    {
      name: "Temperature",
      key: "temperature",
      unit: "°C",
      icon: Thermometer,
      color: "#ef4444",
    },
    { name: "TDS", key: "tds", unit: "ppm", icon: Waves, color: "#8b5cf6" },
  ];

  // Location dropdown options
  const locationOptions = [
    { value: "inlet", label: "🔵 Inlet (Air Masuk)" },
    { value: "outlet", label: "🟢 Outlet (Air Keluar)" },
  ];

  // Period options for quality chart
  const periodOptions = [
    { value: "today", label: "📅 Today" },
    { value: "yesterday", label: "📅 Yesterday" },
    { value: "week", label: "📅 Last 7 Days" },
  ];

  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent spam

    setIsRefreshing(true);

    try {
      await Promise.all(
        [
          refetchDashboard(),
          refetchChart(),
          selectedPlace && refetchHistorical(),
        ].filter(Boolean),
      );

      console.log("✅ All data refreshed!");
    } finally {
      // Minimum 1 second delay to prevent spam
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Data processing - Prioritas Firestore real-time, fallback ke API
  const latestReading = realtimeReading || dashboardData?.latest_reading;
  const currentData =
    selectedPlace && latestReading ? latestReading[selectedPlace] : null;

  // Use real-time data jika tersedia, fallback ke API
  const fuzzyAnalysis = latestReading?.fuzzy_analysis || null;
  const fuzzyStatus = realtimeStatus || fuzzyAnalysis?.status || null;
  const qualityScore =
    realtimeQualityScore || fuzzyAnalysis?.quality_score || 0;
  const recommendations =
    realtimeRecommendations?.length > 0
      ? realtimeRecommendations
      : fuzzyAnalysis?.recommendations || [];
  const violations =
    realtimeViolations?.length > 0
      ? realtimeViolations
      : fuzzyAnalysis?.violations || [];

  // Transform data for chart
  const currentParam = parameters[currentParamIndex];
  const chartData = historicalData
    .map((reading) => {
      const location = selectedPlace;
      if (!reading[location] || reading[location][currentParam.key] === null) {
        return null;
      }
      return {
        timestamp: reading.timestamp, // Use ISO string directly
        value: reading[location][currentParam.key],
      };
    })
    .filter((d) => d !== null)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Sort chronologically

  // Calculate summary from quality chart data
  const qualitySummary =
    Array.isArray(qualityChartData) && qualityChartData.length > 0
      ? {
          avgScore: Math.round(
            qualityChartData.reduce(
              (sum, d) => sum + (d.quality_score || 0),
              0,
            ) / qualityChartData.length,
          ),
          totalViolations: qualityChartData.reduce(
            (sum, d) => sum + (d.alert_count || 0),
            0,
          ),
          dataPoints: qualityChartData.length,
        }
      : null;

  // Priority icons and colors — using centralized statusConfig
  const priorityIcons = {
    critical: ShieldAlert,
    high: AlertTriangle,
    medium: AlertCircle,
    low: Info,
  };
  const getPriorityConfig = (priority) => {
    const sevConfig = getSeverityConfig(priority);
    return {
      icon: priorityIcons[priority] || priorityIcons.low,
      color: sevConfig.tailwind.text,
      bg: sevConfig.tailwind.bg,
      border: sevConfig.tailwind.borderAlt,
    };
  };

  // Type icons
  const getTypeIcon = (type) => {
    const icons = {
      treatment: Droplet,
      maintenance: Wrench,
      monitoring: Activity,
      system: AlertCircle,
    };
    return icons[type] || Lightbulb;
  };

  // Loading State
  if (isLoading) {
    return <LoadingScreen message="Loading Dashboard" icon={Waves} />;
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-red-50/60 via-orange-50/50 to-cyan-50/40 p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-red-200 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={fetchDashboardData} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (!dashboardData || !latestReading) {
    return (
      <div className="min-h-full bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-100 p-4">
        <div className="max-w-4xl mx-auto mt-20">
          <div className="bg-white rounded-2xl shadow-xl border p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Waves className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              No Data Available
            </h2>
            <p className="text-gray-600 mb-2 max-w-md mx-auto text-lg">
              No Sensor Data Fromi{" "}
              <strong>{currentIpal?.ipal_location || "IPAL ini"}</strong>.
            </p>
            <p className="text-gray-500 mb-8 max-w-md mx-auto text-sm">
              Data will appear after the ESP32 sends the first reading or when
              the sensors start operating.
            </p>

            {/* IPAL Info */}
            {currentIpal && (
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 mb-6 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-cyan-600" />
                  <span>
                    <strong>IPAL ID:</strong> {currentIpal.ipal_id}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${getEntityStatusColor(currentIpal.status)}`}
                    >
                      {currentIpal.status || "unknown"}
                    </span>
                  </span>
                </div>
                {currentIpal.sensor_count !== undefined && (
                  <p className="text-xs text-gray-500 mt-2">
                    {currentIpal.sensor_count} sensor(s) registered
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-8 py-3"
            >
              <RefreshCw
                className={`w-5 h-5 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Checking..." : "Check Again"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-full bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      {/* Animated water background effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full space-y-6">
        {/* Enhanced Header with Water Theme */}
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>

          <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            {/* Water wave animation background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-blue-50/30 to-indigo-50/50">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%2306b6d4' fill-opacity='0.05' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundSize: "cover",
                  backgroundPosition: "bottom",
                }}
              ></div>
            </div>

            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start space-x-4">
                  {/* Animated Icon */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl blur-md opacity-50 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg transform hover:scale-110 transition-transform duration-300">
                      <Waves className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                      <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Water Treatment Quality Monitoring
                      </span>
                    </h1>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-1 w-20 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"></div>
                      <div className="h-1 w-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></div>
                    </div>

                    <p className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                      {currentIpal?.ipal_location || "Loading..."}
                    </p>

                    {/* Inlet & Outlet Location Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50 px-3 py-2 rounded-xl group hover:shadow-md transition-all">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <MapPin className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-semibold text-blue-700">
                          Inlet
                        </span>
                        <span className="text-xs text-blue-600 font-mono">
                          {locations.inlet[0].toFixed(5)},{" "}
                          {locations.inlet[1].toFixed(5)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 px-3 py-2 rounded-xl group hover:shadow-md transition-all">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <MapPin className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-semibold text-emerald-700">
                          Outlet
                        </span>
                        <span className="text-xs text-emerald-600 font-mono">
                          {locations.outlet[0].toFixed(5)},{" "}
                          {locations.outlet[1].toFixed(5)}
                        </span>
                      </div>
                    </div>

                    {latestReading?.timestamp && (
                      <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                        <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-gray-700 font-medium">
                            {new Date(latestReading.timestamp).toLocaleString(
                              "id-ID",
                              {
                                dateStyle: "short",
                                timeStyle: "short",
                              },
                            )}
                          </span>
                        </div>

                        {isReadingListening && (
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300/50 px-3 py-1.5 rounded-lg shadow-sm">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="font-semibold text-green-700">
                              Live
                            </span>
                          </div>
                        )}

                        {(criticalAlertCount > 0 || activeAlertCount > 0) && (
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-50 to-orange-50 border border-red-300/50 px-3 py-1.5 rounded-lg shadow-sm animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                            <span className="font-semibold text-red-700">
                              {criticalAlertCount > 0
                                ? `${criticalAlertCount} Critical`
                                : `${activeAlertCount} Alerts`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Refresh Button */}
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="ghost"
                  className="self-start sm:self-center bg-gradient-to-br from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 border border-cyan-200 rounded-xl p-3 transition-all duration-300 hover:shadow-lg group"
                >
                  <RefreshCw
                    className={`w-5 h-5 text-cyan-600 group-hover:text-blue-600 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="animate-fade-in">
          <StatsOverview
            qualityScore={qualityScore}
            status={fuzzyStatus}
            lastUpdate={latestReading?.timestamp}
          />
        </div>

        {/* 🆕 VIOLATIONS & RECOMMENDATIONS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Violations */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-red-200/60 overflow-hidden">
            <div className="p-5 border-b bg-gradient-to-r from-red-50/60 via-orange-50/40 to-cyan-50/30">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-red-500 to-orange-600 p-2.5 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Active Violations
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {violations.length} parameter(s) out of range
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
              {violations.length > 0 ? (
                violations.map((violation, idx) => {
                  const config = getPriorityConfig(violation.severity);
                  const Icon = config.icon;
                  return (
                    <div
                      key={idx}
                      className={`${config.bg} ${config.border} border rounded-xl p-4 hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon
                          className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">
                              {violation.parameter}
                            </span>
                            <span
                              className={`text-xs font-bold ${config.color} uppercase`}
                            >
                              {violation.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {violation.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span>
                              Current:{" "}
                              <strong>{violation.current_value}</strong>
                            </span>
                            <span>
                              Limit: <strong>{violation.threshold}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="bg-green-50 rounded-full p-4 mb-4">
                    <svg
                      className="w-12 h-12 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    No Violations
                  </h4>
                  <p className="text-sm text-gray-600 text-center">
                    All parameters are within acceptable range. Water quality is
                    optimal.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/60 overflow-hidden">
            <div className="p-5 border-b bg-gradient-to-r from-cyan-50/60 via-blue-50/50 to-sky-50/60">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-2.5 rounded-xl">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Recommendations
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {recommendations.length} action item(s) suggested
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
              {recommendations.length > 0 ? (
                recommendations.map((rec, idx) => {
                  const config = getPriorityConfig(rec.priority);
                  const TypeIcon = getTypeIcon(rec.type);
                  const Icon = config.icon;
                  return (
                    <div
                      key={idx}
                      className={`${config.bg} ${config.border} border rounded-xl p-4 hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start gap-3">
                        <TypeIcon
                          className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase">
                              {rec.type}
                            </span>
                            <div className="flex items-center gap-1">
                              <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                              <span
                                className={`text-xs font-bold ${config.color} uppercase`}
                              >
                                {rec.priority}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{rec.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="bg-blue-50 rounded-full p-4 mb-4">
                    <svg
                      className="w-12 h-12 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    No Recommendations
                  </h4>
                  <p className="text-sm text-gray-600 text-center">
                    System is running optimally. No actions required at this
                    time.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quality Score Trend Chart */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/30 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
          <div className="p-5 sm:p-6 border-b bg-gradient-to-r from-cyan-50/60 via-blue-50/50 to-teal-50/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-2.5 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Quality Score Trend
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Fuzzy logic analysis over time
                  </p>
                </div>
              </div>
              <Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                options={periodOptions}
                className="w-full sm:w-48"
              />
            </div>

            {/* Summary Cards */}
            {qualitySummary && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <div className="bg-white/70 rounded-lg p-3 border">
                  <p className="text-xs text-gray-600 mb-1">Average Score</p>
                  <p className="text-xl font-bold text-blue-600">
                    {qualitySummary.avgScore}/100
                  </p>
                </div>
                <div className="bg-white/70 rounded-lg p-3 border">
                  <p className="text-xs text-gray-600 mb-1">Total Violations</p>
                  <p className="text-xl font-bold text-red-600">
                    {qualitySummary.totalViolations}
                  </p>
                </div>
                <div className="bg-white/70 rounded-lg p-3 border">
                  <p className="text-xs text-gray-600 mb-1">Data Points</p>
                  <p className="text-xl font-bold text-green-600">
                    {qualitySummary.dataPoints}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 h-[450px]">
            <Suspense
              fallback={
                <div className="h-full flex items-center justify-center">
                  <div className="text-gray-500">Loading chart...</div>
                </div>
              }
            >
              <QualityScoreChart data={qualityChartData} height={380} />
            </Suspense>
          </div>
        </div>

        {/* Location Selector */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/40 p-6 hover:shadow-2xl transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-2.5 rounded-xl">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Monitoring Location
                </p>
                <p className="text-xs text-gray-500">Select point to analyze</p>
              </div>
            </div>
            <div className="flex-1">
              <Select
                value={selectedPlace}
                onChange={(e) => setSelectedPlace(e.target.value)}
                options={locationOptions}
                placeholder="Choose Inlet or Outlet..."
                className="w-full"
              />
            </div>
          </div>

          {!selectedPlace && (
            <div className="mt-4 p-4 bg-gradient-to-r from-cyan-50/80 via-blue-50/60 to-sky-50/80 rounded-xl border border-cyan-200/50">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-900">
                  <strong>💡 Quick Start:</strong> Select a monitoring location
                  above to view detailed water quality parameters, real-time
                  trends, and historical data analysis
                </p>
              </div>
            </div>
          )}

          {selectedPlace && (
            <div className="mt-4 p-4 bg-gradient-to-r from-teal-50/70 via-cyan-50/60 to-emerald-50/70 rounded-xl border border-teal-200/50">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-900">
                  <strong>✓ Active:</strong> Monitoring{" "}
                  {selectedPlace === "inlet"
                    ? "Inlet (Air Masuk)"
                    : "Outlet (Air Keluar)"}{" "}
                  - Real-time data displayed below
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Parameter Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {parameters.map((param, idx) => {
            const paramValue = currentData?.[param.key];
            const paramStatus =
              selectedPlace && paramValue !== null && paramValue !== undefined
                ? getParameterStatus(param.key, paramValue, selectedPlace)
                : null;

            return (
              <div
                key={idx}
                className="transform hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <DataCard
                  title={param.name}
                  value={paramValue}
                  unit={param.unit}
                  icon={param.icon}
                  status={paramStatus}
                  isActive={!!selectedPlace}
                />
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Panel - 1/3 width on desktop */}
          <div className="lg:col-span-1 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/40 overflow-hidden hover:shadow-2xl transition-shadow duration-300 h-[400px]">
            <div className="p-4 border-b bg-gradient-to-r from-cyan-50/60 via-blue-50/50 to-sky-50/60">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-2 rounded-lg">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    IPAL Location
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {currentIpal?.ipal_location || "IPAL Location"}
                  </p>
                </div>
              </div>
            </div>
            <div className="h-[calc(100%-65px)]">
              <MapContainer
                center={mapCenter}
                zoom={18}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {selectedPlace && (
                  <>
                    <MapUpdater location={locations[selectedPlace]} />{" "}
                    <Marker position={locations[selectedPlace]} icon={ipalIcon}>
                      <Popup>
                        <div className="text-sm p-2">
                          <p className="font-bold capitalize text-gray-900 mb-1">
                            📍 {selectedPlace}
                          </p>
                          <p className="text-xs text-gray-600 mb-2">
                            {currentIpal?.ipal_location || ""}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {locations[selectedPlace][0].toFixed(6)},{" "}
                            {locations[selectedPlace][1].toFixed(6)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}
              </MapContainer>
            </div>
          </div>

          {/* Chart Panel - 2/3 width on desktop */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/40 overflow-hidden hover:shadow-2xl transition-shadow duration-300 h-[400px] flex flex-col">
            <div className="p-4 border-b bg-gradient-to-r from-purple-50/50 via-pink-50/40 to-cyan-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-lg">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    {selectedPlace
                      ? `${currentParam.name} Trend`
                      : "Parameter Trend"}
                  </h3>
                  {selectedPlace && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      Last {chartData.length} readings
                    </p>
                  )}
                </div>
              </div>
              {selectedPlace && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setCurrentParamIndex((prev) =>
                        prev > 0 ? prev - 1 : parameters.length - 1,
                      )
                    }
                    className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200 hover:shadow-md"
                    title="Previous parameter"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <div className="text-xs font-medium text-gray-600 px-2">
                    {currentParamIndex + 1} / {parameters.length}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentParamIndex((prev) =>
                        prev < parameters.length - 1 ? prev + 1 : 0,
                      )
                    }
                    className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200 hover:shadow-md"
                    title="Next parameter"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 p-4 overflow-hidden">
              {!selectedPlace ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-xs">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-700 font-semibold mb-2">
                      Select Location First
                    </p>
                    <p className="text-sm text-gray-500">
                      Choose Inlet or Outlet to view real-time trends
                    </p>
                  </div>
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-full flex flex-col">
                  <div className="flex-1">
                    <Suspense
                      fallback={
                        <div className="h-full flex items-center justify-center">
                          <div className="text-gray-500">Loading chart...</div>
                        </div>
                      }
                    >
                      <LineChart
                        data={chartData}
                        dataKey="value"
                        name={currentParam.name}
                        color={currentParam.color}
                        unit={currentParam.unit}
                        height={260}
                      />
                    </Suspense>
                  </div>
                  <div className="px-1 pb-1 flex justify-end">
                    <button
                      onClick={() => navigate("/sensors")}
                      className="flex items-center gap-1 text-xs font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
                    >
                      View sensor details
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-xs">
                    <div className="bg-gradient-to-br from-orange-100 to-amber-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-10 h-10 text-orange-600" />
                    </div>
                    <p className="text-gray-700 font-semibold mb-2">
                      No Historical Data
                    </p>
                    <p className="text-sm text-gray-500">
                      Data will appear after readings are collected
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
