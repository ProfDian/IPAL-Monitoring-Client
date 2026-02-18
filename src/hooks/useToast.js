// src/hooks/useToast.js
import { useState, useEffect, useCallback } from "react";

/**
 * Reusable toast notification hook
 * Provides success/error message state with auto-dismiss
 *
 * @param {Object} options
 * @param {number} options.successDuration - Auto-dismiss for success (ms), default 4000
 * @param {number} options.errorDuration - Auto-dismiss for error (ms), default 5000
 * @returns {{ success, error, setSuccess, setError, clearMessages }}
 */
const useToast = ({ successDuration = 4000, errorDuration = 5000 } = {}) => {
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), successDuration);
      return () => clearTimeout(t);
    }
  }, [success, successDuration]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), errorDuration);
      return () => clearTimeout(t);
    }
  }, [error, errorDuration]);

  const clearMessages = useCallback(() => {
    setSuccess(null);
    setError(null);
  }, []);

  return { success, error, setSuccess, setError, clearMessages };
};

export default useToast;
