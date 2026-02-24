/**
 * ========================================
 * DASHBOARD SERVICE (UPDATED)
 * ========================================
 * Lokasi: src/services/dashboardService.js
 *
 * Service untuk fetch data dashboard
 * - Summary IPAL (latest reading, statistics, alerts)
 * - Historical data untuk chart
 * - 🆕 Readings untuk chart dengan fuzzy analysis
 */

import api from "./api";

const dashboardService = {
  /**
   * Get dashboard summary untuk IPAL tertentu
   * @param {number} ipalId - IPAL ID (default: 1)
   * @returns {Promise<Object>} Dashboard data
   */
  getSummary: async (ipalId = 1) => {
    try {
      console.log(`📊 Fetching dashboard summary for IPAL ${ipalId}...`);

      const response = await api.get(`/api/dashboard/summary/${ipalId}`);

      console.log("✅ Dashboard summary fetched successfully");
      console.log(
        "   Latest reading:",
        response.data.latest_reading?.timestamp,
      );
      console.log("   Active alerts:", response.data.active_alerts?.total || 0);

      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch dashboard summary:", error.message);
      throw error;
    }
  },

  /**
   * Get overview semua IPAL (optional - untuk future expansion)
   * @returns {Promise<Object>} Overview data
   */
  getOverview: async () => {
    try {
      console.log("📊 Fetching dashboard overview...");

      const response = await api.get("/api/dashboard/overview");

      console.log("✅ Dashboard overview fetched successfully");
      console.log(
        "   Total IPALs:",
        response.data.statistics?.total_ipals || 0,
      );

      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch dashboard overview:", error.message);
      throw error;
    }
  },

  /**
   * 🆕 Get readings untuk chart dengan fuzzy analysis
   * Endpoint baru yang optimal untuk Recharts!
   *
   * @param {number} ipalId - IPAL ID
   * @param {Object} options - Filter options
   * @param {string} options.period - Period filter: 'today', 'yesterday', 'week', 'custom'
   * @param {string} options.start - Start date (ISO format, required if period='custom')
   * @param {string} options.end - End date (ISO format, required if period='custom')
   * @param {number} options.limit - Max readings (default: 100, max: 500)
   * @returns {Promise<Object>} Chart data with summary
   *
   * @example
   * // Get last 7 days
   * const data = await dashboardService.getReadingsForChart(1, { period: 'week' });
   *
   * // Get today only
   * const data = await dashboardService.getReadingsForChart(1, { period: 'today' });
   *
   * // Custom date range
   * const data = await dashboardService.getReadingsForChart(1, {
   *   period: 'custom',
   *   start: '2025-11-01',
   *   end: '2025-11-10'
   * });
   */
  getReadingsForChart: async (ipalId = 1, options = {}) => {
    try {
      const {
        period = "week", // today|yesterday|week|custom
        start = null, // ISO date string (for custom)
        end = null, // ISO date string (for custom)
        limit = 100, // Default: 100, Max: 500
      } = options;

      console.log(`📈 Fetching chart data for IPAL ${ipalId}...`);
      console.log("   Options:", { period, start, end, limit });

      // Build query params
      const params = new URLSearchParams({
        period,
        limit: limit.toString(),
      });

      // Add custom date range if specified
      if (period === "custom") {
        if (!start || !end) {
          throw new Error("Custom period requires start and end dates");
        }
        params.append("start", start);
        params.append("end", end);
      }

      const response = await api.get(
        `/api/dashboard/readings/${ipalId}?${params.toString()}`,
      );

      console.log("✅ Chart data fetched successfully");
      console.log("   Total readings:", response.count || 0);
      console.log("   Period:", response.period);
      console.log("   Date range:", response.date_range);
      console.log(
        "   Avg quality score:",
        response.summary?.average_quality_score,
      );

      return response;
    } catch (error) {
      console.error("❌ Failed to fetch chart data:", error.message);
      throw error;
    }
  },

  /**
   * Get historical readings untuk chart (OLD METHOD - masih bisa dipakai)
   * @param {number} ipalId - IPAL ID
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of readings
   */
  getHistoricalData: async (ipalId = 1, options = {}) => {
    try {
      const {
        limit = 24, // Default: last 24 readings
        order = "desc", // desc = newest first
      } = options;

      console.log(`📈 Fetching historical data for IPAL ${ipalId}...`);
      console.log("   Options:", { limit, order });

      const response = await api.get(
        `/api/sensors/readings?ipal_id=${ipalId}&limit=${limit}&order=${order}`,
      );

      console.log("✅ Historical data fetched successfully");
      console.log("   Total readings:", response.data?.length || 0);

      return response.data || [];
    } catch (error) {
      console.error("❌ Failed to fetch historical data:", error.message);
      throw error;
    }
  },

  /**
   * Get latest reading untuk IPAL tertentu
   * @param {number} ipalId - IPAL ID
   * @returns {Promise<Object>} Latest reading data
   */
  getLatestReading: async (ipalId = 1) => {
    try {
      console.log(`📊 Fetching latest reading for IPAL ${ipalId}...`);

      const response = await api.get(
        `/api/sensors/readings?ipal_id=${ipalId}&limit=1&order=desc`,
      );

      if (response.data && response.data.length > 0) {
        console.log("✅ Latest reading fetched successfully");
        console.log("   Timestamp:", response.data[0].timestamp);
        return response.data[0];
      }

      console.log("⚠️  No readings found");
      return null;
    } catch (error) {
      console.error("❌ Failed to fetch latest reading:", error.message);
      throw error;
    }
  },

  /**
   * Get active alerts untuk IPAL tertentu
   * @param {number} ipalId - IPAL ID
   * @returns {Promise<Array>} Array of active alerts
   */
  getActiveAlerts: async (ipalId = 1) => {
    try {
      console.log(`🚨 Fetching active alerts for IPAL ${ipalId}...`);

      const response = await api.get(
        `/api/alerts?ipal_id=${ipalId}&status=active&limit=10`,
      );

      console.log("✅ Active alerts fetched successfully");
      console.log("   Total alerts:", response.count || 0);

      return response.data || [];
    } catch (error) {
      console.error("❌ Failed to fetch active alerts:", error.message);
      throw error;
    }
  },

  /**
   * Get statistics summary
   * @param {number} ipalId - IPAL ID
   * @returns {Promise<Object>} Statistics data
   */
  getStatistics: async (ipalId = 1) => {
    try {
      console.log(`📊 Fetching statistics for IPAL ${ipalId}...`);

      // Get dari summary endpoint (sudah include statistics)
      const summary = await dashboardService.getSummary(ipalId);

      return summary.statistics || null;
    } catch (error) {
      console.error("❌ Failed to fetch statistics:", error.message);
      throw error;
    }
  },
};

export default dashboardService;
