// src/utils/sensorHelpers.js

/**
 * Get display label for sensor type
 * @param {string} type - "ph", "tds", "temperature"
 * @returns {string}
 */
export const getSensorTypeLabel = (type) => {
  const labels = {
    ph: "pH",
    tds: "TDS",
    temperature: "Temperature",
  };
  return labels[type] || type;
};

/**
 * Get unit for sensor type
 * @param {string} type - "ph", "tds", "temperature"
 * @returns {string}
 */
export const getSensorUnit = (type) => {
  const units = {
    ph: "",
    tds: "ppm",
    temperature: "°C",
  };
  return units[type] || "";
};

/**
 * Sensor type metadata (icons & colors)
 * Note: Import icons where needed, this provides the color/label info
 */
export const SENSOR_TYPE_META = {
  ph: { label: "pH", color: "text-blue-600 bg-blue-100" },
  tds: { label: "TDS", color: "text-green-600 bg-green-100" },
  temperature: { label: "Temperature", color: "text-red-600 bg-red-100" },
};

/**
 * Threshold ranges for sensor types
 */
export const SENSOR_THRESHOLDS = {
  ph: { min: 6, max: 9, unit: "" },
  tds: { min: 0, max: 4000, unit: "ppm" },
  temperature: { min: 0, max: 40, unit: "°C" },
};

/**
 * Check if a sensor value is within normal threshold
 * @param {string} type - Sensor type
 * @param {number} value - Sensor value
 * @returns {{ isNormal: boolean, message: string }}
 */
export const checkThreshold = (type, value) => {
  const threshold = SENSOR_THRESHOLDS[type];
  if (!threshold || value == null) return { isNormal: true, message: "" };

  if (value < threshold.min) {
    return {
      isNormal: false,
      message: `Below minimum (${threshold.min}${threshold.unit})`,
    };
  }
  if (value > threshold.max) {
    return {
      isNormal: false,
      message: `Above maximum (${threshold.max}${threshold.unit})`,
    };
  }
  return { isNormal: true, message: "Normal" };
};
