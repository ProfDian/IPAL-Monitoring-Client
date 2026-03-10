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
 * Modal that appears when a new alert/violation is detected
 * Requires user acknowledgment (no auto-dismiss)
 */
const AlertModal = ({ alert, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [alert]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsLeaving(false);
      onDismiss?.();
    }, 250);
  };

  const handleViewAlerts = () => {
    handleDismiss();
    navigate("/alerts");
  };

  if (!alert) return null;

  const severity = alert.severity || "high";
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.high;
  const Icon = config.icon;

  const modal = (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-250 ${
        isVisible && !isLeaving
          ? "opacity-100"
          : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-250 ${
          isVisible && !isLeaving ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleDismiss}
      />

      {/* Card */}
      <div
        className={`relative w-full max-w-md transform transition-all duration-300 ${
          isVisible && !isLeaving
            ? "scale-100 translate-y-0"
            : "scale-95 translate-y-4"
        }`}
      >
        <div
          className={`bg-white rounded-2xl shadow-2xl overflow-hidden border ${config.border}`}
        >
          {/* Top gradient bar */}
          <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6">
            {/* Icon + severity badge */}
            <div className="flex flex-col items-center text-center mb-4">
              <div
                className={`p-3 rounded-2xl ${config.iconBg} ${config.pulse} mb-3`}
              >
                <Icon className="w-8 h-8" />
              </div>
              <span
                className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-white bg-gradient-to-r ${config.gradient}`}
              >
                {config.label}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
              Peringatan Baru!
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              IPAL {alert.ipal_id}
            </p>

            {/* Alert details */}
            <div
              className={`rounded-xl p-4 ${config.bg} ${config.border} border mb-4`}
            >
              <p className="text-sm font-semibold text-gray-900 mb-2">
                {alert.message || alert.rule || "Parameter di luar baku mutu"}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {alert.parameter && (
                  <div>
                    <span className="text-gray-500">Parameter</span>
                    <p className="font-semibold text-gray-800 capitalize">
                      {alert.parameter}
                    </p>
                  </div>
                )}
                {alert.value != null && (
                  <div>
                    <span className="text-gray-500">Nilai</span>
                    <p className="font-semibold text-gray-800">
                      {typeof alert.value === "number"
                        ? alert.value.toFixed(2)
                        : alert.value}
                    </p>
                  </div>
                )}
                {alert.threshold != null && (
                  <div>
                    <span className="text-gray-500">Batas</span>
                    <p className="font-semibold text-gray-800">
                      {alert.threshold}
                    </p>
                  </div>
                )}
                {alert.location && (
                  <div>
                    <span className="text-gray-500">Lokasi</span>
                    <p className="font-semibold text-gray-800 capitalize">
                      {alert.location}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={handleViewAlerts}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-gradient-to-r ${config.gradient} hover:shadow-lg transition-all flex items-center justify-center gap-1.5`}
              >
                Lihat Alert
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default AlertModal;
