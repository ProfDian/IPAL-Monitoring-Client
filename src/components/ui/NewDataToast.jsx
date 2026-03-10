import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Activity, Droplets, Thermometer, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS_CONFIG = {
  excellent: {
    color: "emerald",
    label: "Excellent",
    bg: "from-emerald-500 to-green-600",
  },
  good: { color: "green", label: "Good", bg: "from-green-500 to-emerald-600" },
  fair: { color: "yellow", label: "Fair", bg: "from-yellow-500 to-amber-600" },
  poor: { color: "orange", label: "Poor", bg: "from-orange-500 to-red-500" },
  critical: { color: "red", label: "Critical", bg: "from-red-500 to-red-700" },
};

/**
 * Floating toast notification for new water quality data
 * Slides in from the right with smooth animations
 */
const NewDataToast = ({ data, onDismiss, autoDismiss = 10000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!data) return;

    // Trigger enter animation
    const enterTimer = setTimeout(() => setIsVisible(true), 50);

    // Auto-dismiss
    let dismissTimer;
    if (autoDismiss > 0) {
      dismissTimer = setTimeout(() => handleDismiss(), autoDismiss);
    }

    return () => {
      clearTimeout(enterTimer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [data]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsLeaving(false);
      onDismiss?.();
    }, 300);
  };

  const handleViewDetail = () => {
    handleDismiss();
    navigate("/dashboard");
  };

  if (!data) return null;

  const score = data.fuzzy_analysis?.quality_score ?? 0;
  const status = data.fuzzy_analysis?.status || "unknown";
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.fair;
  const inlet = data.inlet;
  const outlet = data.outlet;
  const timestamp = data.timestamp
    ? new Date(data.timestamp).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";

  const toast = (
    <div
      className={`fixed top-4 right-4 z-[9998] w-[380px] max-w-[calc(100vw-2rem)] transition-all duration-300 ease-out ${
        isVisible && !isLeaving
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      }`}
    >
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden">
        {/* Score bar */}
        <div className={`h-1.5 bg-gradient-to-r ${config.bg}`}>
          <div
            className="h-full bg-white/30 transition-all duration-1000"
            style={{ width: `${100 - score}%`, marginLeft: "auto" }}
          />
        </div>

        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${config.bg}`}>
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">
                Data Baru Diterima
              </p>
              <p className="text-[10px] text-gray-500">
                IPAL {data.ipal_id} &bull; {timestamp}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Score badge */}
            <div
              className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${config.bg} text-white text-xs font-bold`}
            >
              {score}/100
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sensor data */}
        {outlet && (
          <div className="px-4 pb-2">
            <div className="grid grid-cols-3 gap-2">
              <SensorPill
                icon={<Droplets className="w-3 h-3" />}
                label="pH"
                value={outlet.ph?.toFixed(2)}
                warn={outlet.ph < 6.0 || outlet.ph > 9.0}
              />
              <SensorPill
                icon={<Activity className="w-3 h-3" />}
                label="TDS"
                value={`${outlet.tds?.toFixed(0)}`}
                unit="mg/L"
                warn={outlet.tds > 4000}
              />
              <SensorPill
                icon={<Thermometer className="w-3 h-3" />}
                label="Suhu"
                value={`${outlet.temperature?.toFixed(1)}`}
                unit="°C"
                warn={outlet.temperature > 40}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <p className="text-[10px] text-gray-400">
            Status:{" "}
            <span className="font-semibold capitalize text-gray-600">
              {config.label}
            </span>
          </p>
          <button
            onClick={handleViewDetail}
            className="flex items-center gap-1 text-[11px] font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
          >
            Lihat Detail
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Progress bar for auto-dismiss */}
        {autoDismiss > 0 && (
          <div className="h-0.5 bg-gray-100">
            <div
              className="h-full bg-cyan-400/60 origin-left"
              style={{
                animation: `shrinkWidth ${autoDismiss}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(toast, document.body);
};

const SensorPill = ({ icon, label, value, unit, warn }) => (
  <div
    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs ${
      warn
        ? "bg-red-50 text-red-700 border border-red-200"
        : "bg-gray-50 text-gray-700 border border-gray-100"
    }`}
  >
    <span className={warn ? "text-red-500" : "text-gray-400"}>{icon}</span>
    <div className="min-w-0">
      <p className="text-[9px] text-gray-400 leading-none">{label}</p>
      <p className="font-semibold leading-tight">
        {value ?? "—"}
        {unit && <span className="text-[9px] font-normal"> {unit}</span>}
      </p>
    </div>
  </div>
);

export default NewDataToast;
