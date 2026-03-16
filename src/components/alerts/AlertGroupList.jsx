/**
 * ========================================
 * ALERT GROUP LIST
 * ========================================
 * Container that groups alerts by reading_id
 * and displays them as AlertGroupCards
 */

import { useMemo, useState } from "react";
import AlertGroupCard from "./AlertGroupCard";
import { RefreshCw } from "lucide-react";
import { InlineLoader } from "../ui";

const AlertGroupList = ({
  alerts,
  loading,
  onAcknowledgeAll,
  onResolveAll,
}) => {
  const [processingGroups, setProcessingGroups] = useState(new Set());

  // Group alerts by reading_id
  const groupedAlerts = useMemo(() => {
    const groups = {};

    alerts.forEach((alert) => {
      const key = alert.reading_id || "unknown";

      if (!groups[key]) {
        groups[key] = {
          reading_id: key,
          alerts: [],
        };
      }

      groups[key].alerts.push(alert);
    });

    // Convert to array and sort by latest created_at (newest first)
    return Object.values(groups).sort((a, b) => {
      const aLatest = Math.max(
        ...a.alerts.map((alert) => {
          // Handle Firestore Timestamp or Date string
          const date = alert.created_at?.toDate
            ? alert.created_at.toDate()
            : new Date(alert.created_at);
          return date.getTime();
        }),
      );
      const bLatest = Math.max(
        ...b.alerts.map((alert) => {
          const date = alert.created_at?.toDate
            ? alert.created_at.toDate()
            : new Date(alert.created_at);
          return date.getTime();
        }),
      );
      return bLatest - aLatest;
    });
  }, [alerts]);

  // Handle acknowledge all for a group
  const handleAcknowledgeAll = async (alertIds, readingId) => {
    setProcessingGroups((prev) => new Set(prev).add(readingId));
    try {
      await onAcknowledgeAll(alertIds);
    } finally {
      setProcessingGroups((prev) => {
        const next = new Set(prev);
        next.delete(readingId);
        return next;
      });
    }
  };

  // Handle resolve all for a group
  const handleResolveAll = async (alertIds, readingId) => {
    setProcessingGroups((prev) => new Set(prev).add(readingId));
    try {
      await onResolveAll(alertIds);
    } finally {
      setProcessingGroups((prev) => {
        const next = new Set(prev);
        next.delete(readingId);
        return next;
      });
    }
  };

  // Loading state
  if (loading && alerts.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-2xl p-8">
        <InlineLoader message="Loading alert groups..." size="lg" />
      </div>
    );
  }

  // Empty state
  if (groupedAlerts.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-2xl p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No alerts found
        </h3>
        <p className="text-sm text-gray-500">
          No alerts match your current filters. Try adjusting your filters or
          check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white shadow-md rounded-xl px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Alert Groups ({groupedAlerts.length})
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Grouped by reading • {alerts.length} total alert
          {alerts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Alert Groups */}
      {groupedAlerts.map((group) => (
        <AlertGroupCard
          key={group.reading_id}
          alertGroup={group}
          onAcknowledgeAll={(alertIds) =>
            handleAcknowledgeAll(alertIds, group.reading_id)
          }
          onResolveAll={(alertIds) =>
            handleResolveAll(alertIds, group.reading_id)
          }
          processing={processingGroups.has(group.reading_id)}
        />
      ))}
    </div>
  );
};

export default AlertGroupList;
