/**
 * ========================================
 * ALERT GROUP CARD
 * ========================================
 * Displays a group of alerts from the same reading
 * Shows all violations in a collapsible card
 */

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Droplet,
  Thermometer,
  Waves,
  AlertTriangle,
  CheckCircle,
  Check,
} from "lucide-react";
import {
  getSeverityStyles,
  getAlertStatusColor,
} from "../../utils/statusConfig";
import { format } from "date-fns";

const AlertGroupCard = ({
  alertGroup,
  onAcknowledgeAll,
  onResolveAll,
  processing,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isSensorAnomalyAlert = (alert) =>
    alert?.alert_type === "SENSOR_ANOMALY" ||
    alert?.source === "sensor_diagnostic" ||
    alert?.location === "anomaly";

  // Get the highest severity in the group
  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const highestSeverity = alertGroup.alerts.reduce((max, alert) => {
    const currentLevel = severityOrder[alert.severity] || 0;
    const maxLevel = severityOrder[max] || 0;
    return currentLevel > maxLevel ? alert.severity : max;
  }, "low");

  // Get the most recent timestamp from created_at
  const latestTimestamp = alertGroup.alerts.reduce((latest, alert) => {
    // Handle Firestore Timestamp or Date string
    const alertTime = alert.created_at?.toDate
      ? alert.created_at.toDate()
      : new Date(alert.created_at);
    return alertTime > latest ? alertTime : latest;
  }, new Date(0));

  // Get common info from first alert
  const firstAlert = alertGroup.alerts[0];
  const ipalId = firstAlert.ipal_id;
  const location = firstAlert.location || "outlet";
  const anomalyCount = alertGroup.alerts.filter(isSensorAnomalyAlert).length;
  const complianceCount = alertGroup.alerts.length - anomalyCount;
  const groupLabel =
    anomalyCount > 0 && complianceCount > 0
      ? "Campuran"
      : anomalyCount > 0
        ? "Anomali Sensor"
        : "Pelanggaran Baku Mutu";
  const allResolved = alertGroup.alerts.every((a) => a.status === "resolved");
  const allAcknowledged = alertGroup.alerts.every(
    (a) => a.status === "acknowledged" || a.status === "resolved",
  );
  const hasActiveAlerts = alertGroup.alerts.some((a) => a.status === "active");

  const styles = getSeverityStyles(highestSeverity);

  // Parameter icon
  const getParameterIcon = (parameter) => {
    const iconClass = "h-4 w-4";
    const param = parameter?.toLowerCase();

    switch (param) {
      case "ph":
        return <Droplet className={iconClass} />;
      case "temperature":
        return <Thermometer className={iconClass} />;
      case "tds":
        return <Waves className={iconClass} />;
      default:
        return <AlertTriangle className={iconClass} />;
    }
  };

  // Handle acknowledge all
  const handleAcknowledgeAll = () => {
    const activeAlertIds = alertGroup.alerts
      .filter((a) => a.status === "active")
      .map((a) => a.id);
    if (activeAlertIds.length > 0) {
      onAcknowledgeAll(activeAlertIds);
    }
  };

  // Handle resolve all
  const handleResolveAll = () => {
    const unresolvedAlertIds = alertGroup.alerts
      .filter((a) => a.status !== "resolved")
      .map((a) => a.id);
    if (unresolvedAlertIds.length > 0) {
      onResolveAll(unresolvedAlertIds);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all ${styles.border} overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`${styles.bg} px-4 py-3 cursor-pointer`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* ⭐ Main Title - Date & Time */}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-xl font-bold text-gray-900">
                {format(latestTimestamp, "dd MMM yyyy")}
              </h3>
              <span
                className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase ${styles.badge}`}
              >
                {highestSeverity}
              </span>
              {allResolved && (
                <span className="px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 inline mr-1" />
                  Resolved
                </span>
              )}
            </div>

            {/* ⭐ Subtitle - Time + Details (smaller, wrappable) */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-600">
              <span className="flex items-center font-medium">
                <Clock className="h-3.5 w-3.5 mr-1" />
                {format(latestTimestamp, "HH:mm:ss")}
              </span>
              <span className="text-gray-400 hidden sm:inline">•</span>
              <span className="text-xs text-gray-500 hidden sm:inline">
                Reading #{alertGroup.reading_id.slice(-8)}
              </span>
              <span className="text-gray-400">•</span>
              <span>IPAL {ipalId}</span>
              <span className="text-gray-400">•</span>
              <span className="capitalize">{location}</span>
              <span className="text-gray-400">•</span>
              <span className="font-medium text-gray-700">{groupLabel}</span>
              <span className="text-gray-400">•</span>
              <span className="font-semibold text-red-600">
                {alertGroup.alerts.length} alert
                {alertGroup.alerts.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Expand/Collapse Icon */}
          <button className="ml-4 text-gray-500 hover:text-gray-700 flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Violations List (Collapsible) */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Violations */}
          <div className="px-4 py-3 space-y-2">
            {alertGroup.alerts.map((alert, index) => (
              <div
                key={alert.id}
                className={`flex items-start p-3 rounded-lg ${
                  alert.status === "resolved"
                    ? "bg-gray-50 opacity-60"
                    : "bg-white border border-gray-200"
                }`}
              >
                {/* Parameter Icon */}
                <div
                  className={`flex-shrink-0 p-2 rounded-full ${
                    getSeverityStyles(alert.severity).icon
                  }`}
                >
                  {getParameterIcon(alert.parameter)}
                </div>

                {/* Violation Info */}
                <div className="ml-3 flex-1 min-w-0">
                  {(() => {
                    const isSensorAnomaly = isSensorAnomalyAlert(alert);
                    const sourceLabel = isSensorAnomaly
                      ? "Anomali Sensor"
                      : "Pelanggaran Baku Mutu";
                    const thresholdLabel = isSensorAnomaly
                      ? "Rentang Sensor"
                      : "Batas Baku Mutu";

                    return (
                      <>
                        <div className="mb-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${
                              isSensorAnomaly
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {sourceLabel}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {alert.parameter?.toUpperCase()}
                          </h4>
                          <div className="flex space-x-1">
                            <span
                              className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${getAlertStatusColor(
                                alert.status,
                              )}`}
                            >
                              {alert.status}
                            </span>
                            <span
                              className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${
                                getSeverityStyles(alert.severity).badge
                              }`}
                            >
                              {alert.severity}
                            </span>
                          </div>
                        </div>

                        <p className="mt-1 text-xs sm:text-sm text-gray-600 break-words">
                          {alert.message}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span className="font-medium">
                            Value:{" "}
                            <span className="text-red-600">{alert.value}</span>
                          </span>
                          <span>
                            {thresholdLabel}: {alert.threshold}
                          </span>
                          {alert.deviation && (
                            <span>Deviation: +{alert.deviation}</span>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          {!allResolved && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-2">
                {hasActiveAlerts && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcknowledgeAll();
                    }}
                    disabled={processing}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-lg text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Acknowledge All (
                    {
                      alertGroup.alerts.filter((a) => a.status === "active")
                        .length
                    }
                    )
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResolveAll();
                  }}
                  disabled={processing}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve All (
                  {
                    alertGroup.alerts.filter((a) => a.status !== "resolved")
                      .length
                  }
                  )
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed Preview */}
      {!isExpanded && (
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">Parameters:</span>
            {alertGroup.alerts.slice(0, 3).map((alert, index) => (
              <span
                key={alert.id}
                className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs"
              >
                {alert.parameter?.toUpperCase()}
              </span>
            ))}
            {alertGroup.alerts.length > 3 && (
              <span className="text-xs text-gray-500">
                +{alertGroup.alerts.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertGroupCard;
