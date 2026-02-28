import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";
import app from "../config/firebase";

// Initialize messaging only if supported
let messaging = null;

const initMessaging = async () => {
  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
      console.log("✅ FCM Messaging initialized");
    } else {
      console.log("⚠️ FCM not supported in this environment");
    }
  } catch (error) {
    console.log("⚠️ FCM initialization error:", error.message);
  }
};

// Initialize on module load
initMessaging();

/**
 * Ensure SW is registered and return the registration.
 * Called before getToken so Firebase always has a valid SW.
 */
async function ensureServiceWorkerRegistered() {
  if (!("serviceWorker" in navigator)) return null;

  try {
    // getRegistration() takes a SCOPE url, not the script path
    // scope "/" means: SW that controls the root of the site
    const existing = await navigator.serviceWorker.getRegistration("/");
    if (existing) {
      console.log("✅ SW already registered, scope:", existing.scope);
      // Wait until it's active (handles installing/waiting states)
      if (existing.installing) {
        await new Promise((resolve) => {
          existing.installing.addEventListener("statechange", (e) => {
            if (e.target.state === "activated") resolve();
          });
        });
      }
      return existing;
    }

    // No SW at root scope — register fresh
    console.log("🔄 Registering SW fresh...");
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" },
    );

    // Wait until SW is active
    await navigator.serviceWorker.ready;
    console.log("✅ SW registered & active:", registration.scope);
    return registration;
  } catch (err) {
    console.error("❌ SW registration failed:", err);
    return null;
  }
}

/**
 * Request notification permission & get FCM token
 */
export async function requestNotificationPermission() {
  try {
    if (!messaging) {
      console.log("⚠️ FCM not available - skipping notification request");
      return { success: false, error: "FCM not supported" };
    }

    console.log("🔔 Requesting notification permission...");

    // Request permission
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("✅ Notification permission granted");

      // Ensure SW is registered BEFORE calling getToken
      // Without this, getToken fails when SW was previously unregistered
      const swRegistration = await ensureServiceWorkerRegistered();

      // Get FCM token, always passing the SW registration explicitly
      const tokenOptions = {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      };
      if (swRegistration) {
        tokenOptions.serviceWorkerRegistration = swRegistration;
      }

      const token = await getToken(messaging, tokenOptions);

      if (token) {
        console.log("✅ FCM Token received:", token);
        return { success: true, token };
      } else {
        console.log("❌ No token received");
        return { success: false, error: "No token" };
      }
    } else {
      console.log("❌ Notification permission denied");
      return { success: false, error: "Permission denied" };
    }
  } catch (error) {
    console.error("❌ Error getting FCM token:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Register FCM token to backend
 */
export async function registerFCMToken(token) {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const authToken = localStorage.getItem("token"); // Your JWT token

    const response = await fetch(
      `${apiUrl}/api/notifications/register-device`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ fcm_token: token }),
      },
    );

    const data = await response.json();

    if (data.success) {
      console.log("✅ FCM token registered to backend");
      localStorage.setItem("fcm_token", token);
      return { success: true };
    } else {
      console.error("❌ Failed to register token:", data.message);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error("❌ Error registering FCM token:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Listen for foreground messages
 */
export function onMessageListener(callback) {
  if (!messaging) {
    console.log("⚠️ FCM not available - skipping message listener");
    return () => {}; // Return empty unsubscribe function
  }

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("🔔 Foreground message received:", payload);

      // Show browser notification
      if (Notification.permission === "granted") {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: "/LogoIPAL.png",
          tag: payload.data?.alert_id || "notification",
        });
      }

      // Call callback for UI updates
      if (callback) {
        callback(payload);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error("❌ Error setting up message listener:", error);
    return () => {};
  }
}
