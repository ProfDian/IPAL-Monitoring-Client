// Service Worker for FCM (background notifications)
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
);

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

  // Get the alert ID from notification data
  const alertId = event.notification.data?.alert_id;

  // Build URL with redirect parameter
  const baseUrl = self.location.origin;
  const targetUrl = `${baseUrl}/alerts?from=notification${
    alertId ? `&alert=${alertId}` : ""
  }`;

  // Open alerts page with redirect parameter
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(baseUrl) && "focus" in client) {
            return client.focus().then(() => client.navigate(targetUrl));
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      }),
  );
});
