// Service Worker for FCM (background notifications)
// v3 - force skipWaiting so new SW activates immediately
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
);

// Force new SW to activate immediately without waiting for tabs to close
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Production frontend URL — hardcoded, never use self.location.origin
const FRONTEND_BASE_URL = "https://ipal-monitoring-teklingundip.vercel.app";

// Firebase config (same as frontend)
const firebaseConfig = {
  apiKey: "AIzaSyC4tbgUYb0EnePaQA2TOI4VTsS1e4zrJeI",
  authDomain: "water-quality-monitoring-dcdc0.firebaseapp.com",
  databaseURL:
    "https://water-quality-monitoring-dcdc0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "water-quality-monitoring-dcdc0",
  storageBucket: "water-quality-monitoring-dcdc0.firebasestorage.app",
  messagingSenderId: "1012798196989",
  appId: "1:1012798196989:web:a7e99e9605ada7f5e7c294",
  measurementId: "G-JVXM7VEJ9F",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message:",
    payload,
  );

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/LogoIPAL.png",
    badge: "/LogoIPAL.png",
    tag: payload.data?.alert_id || "notification",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification clicked:", event);

  event.notification.close();

  const alertId = event.notification.data?.alert_id;

  // ALWAYS use hardcoded production URL — never self.location.origin
  // self.location.origin would be localhost if SW was registered from localhost
  const targetUrl = `${FRONTEND_BASE_URL}/alerts?from=notification${
    alertId ? `&alert=${alertId}` : ""
  }`;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If production tab already open, focus + navigate
        for (const client of clientList) {
          if (client.url.startsWith(FRONTEND_BASE_URL) && "focus" in client) {
            return client.focus().then(() => client.navigate(targetUrl));
          }
        }
        // Otherwise open new tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      }),
  );
});
