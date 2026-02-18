// src/hooks/useFCM.js
import { useEffect, useRef } from "react";
import {
  requestNotificationPermission,
  registerFCMToken,
  onMessageListener,
} from "../services/fcmService";

/**
 * Hook to initialize FCM push notifications.
 * Should be used inside a component that only renders when user is authenticated.
 *
 * @param {Object} options
 * @param {function} options.onForegroundMessage - Callback when a foreground push is received
 */
const useFCM = ({ onForegroundMessage } = {}) => {
  const initializedRef = useRef(false);

  useEffect(() => {
    // Cek JWT token — kalau belum ada, skip
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      console.log("ℹ️ useFCM: No auth token, skipping FCM init");
      return;
    }

    // Cegah inisialisasi ganda (StrictMode, re-render)
    if (initializedRef.current) return;
    initializedRef.current = true;

    let unsubscribe = null;

    const initFCM = async () => {
      console.log("🔔 useFCM: Initializing FCM...");

      try {
        // 1. Minta izin notifikasi browser + dapatkan FCM token
        const result = await requestNotificationPermission();

        if (result.success && result.token) {
          console.log("✅ useFCM: FCM Token obtained");

          // 2. Register token ke backend (disimpan di doc user di Firestore)
          await registerFCMToken(result.token);

          // 3. Listen foreground notifications
          unsubscribe = onMessageListener((payload) => {
            console.log("📬 useFCM: Foreground notification:", payload);

            if (onForegroundMessage) {
              onForegroundMessage(payload);
            }
          });
        } else {
          console.log("⚠️ useFCM: FCM skipped:", result.error);
        }
      } catch (error) {
        console.error("❌ useFCM: FCM initialization error:", error);
      }
    };

    initFCM();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // Jalan sekali saat component mount (DashboardLayout = setelah login)
};

export default useFCM;
