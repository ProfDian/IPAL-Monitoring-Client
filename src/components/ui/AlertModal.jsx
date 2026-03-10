import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ShieldAlert, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SEVERITY_CONFIG = {
  critical: {
    gradient: "from-red-600 to-red-800",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: ShieldAlert,
    iconBg: "bg-red-100 text-red-600",
    pulse: "animate-pulse",
    label: "CRITICAL",
  },
  high: {
    gradient: "from-orange-500 to-red-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: AlertTriangle,
    iconBg: "bg-orange-100 text-orange-600",
    pulse: "",
    label: "HIGH",
  },
  medium: {
    gradient: "from-yellow-500 to-orange-500",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon: AlertTriangle,
    iconBg: "bg-yellow-100 text-yellow-600",
    pulse: "",
    label: "MEDIUM",
  },
};

/**
 * Toast notification for new alerts/violations
 * Slides in from the right, auto-dismisses after 12 seconds
 */
const AlertModal = ({ alert, onDismiss, autoDismiss = 12000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!alert) return;

    const enterTimer = setTimeout(() => setIsVisible(true), 50);

    let dismissTimer;
    if (autoDismiss > 0) {
      dismissTimer = setTimeout(() => handleDismiss(), autoDismiss);
    }

    return () => {
      clearTimeout(enterTimer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [alert]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsLeaving(false);
      onDismiss?.();
    }, 300);
  };

  const handleViewAlerts = () => {
    handleDismiss();
    navigate("/alerts");
  };

  if (!alert) return null;

  const severity = alert.severity || "high";
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.high;
  const Icon = config.icon;

  const toast = (
    <div
      className={`fixed top-20 right-4 z-[9997] w-[380px] max-w-[calc(100vw-2rem)] transition-all duration-300 ease-out ${
        isVisible && !isLeaving
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border ${config.border} overflow-hidden`}
      >
        {/* Severity bar */}
        <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />

        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${config.iconBg} ${config.pulse}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">New Alert</p>
              <p className="text-[10px] text-gray-500">IPAL {alert.ipal_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-white bg-gradient-to-r ${config.gradient}`}
            >
              {config.label}
            </span>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Alert details */}
        <div className="px-4 pb-2">
          <div
            className={`rounded-lg p-2.5 ${config.bg} ${config.border} border`}
          >
            <p className="text-xs font-semibold text-gray-900 mb-1.5 line-clamp-2">
              {alert.message || alert.rule || "Parameter exceeded threshold"}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
              {alert.parameter && (
                <div>
                  <span className="text-gray-500">Parameter: </span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {alert.parameter}
                  </span>
                </div>
              )}
              {alert.value != null && (
                <div>
                  <span className="text-gray-500">Value: </span>
                  <span className="font-semibold text-gray-800">
                    {typeof alert.value === "number"
                      ? alert.value.toFixed(2)
                      : alert.value}
                  </span>
                </div>
              )}
              {alert.threshold != null && (
                <div>
                  <span className="text-gray-500">Threshold: </span>
                  <span className="font-semibold text-gray-800">
                    {alert.threshold}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <p className="text-[10px] text-gray-400">
            Severity:{" "}
            <span className="font-semibold capitalize text-gray-600">
              {config.label.toLowerCase()}
            </span>
          </p>
          <button
            onClick={handleViewAlerts}
            className="flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            View Alerts
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Progress bar for auto-dismiss */}
        {autoDismiss > 0 && (
          <div className="h-0.5 bg-gray-100">
            <div
              className="h-full bg-red-400/60 origin-left"
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

export default AlertModal;
