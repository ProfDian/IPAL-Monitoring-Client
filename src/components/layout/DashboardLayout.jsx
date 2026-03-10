// src/components/layout/DashboardLayout.jsx
import { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import useFCM from "../../hooks/useFCM";
import { useIPAL } from "../../context/IPALContext";
import { useRealtimeLatestReading } from "../../hooks/useRealtimeLatestReading";
import { useRealtimeAlerts } from "../../hooks/useRealtimeAlerts";
import NewDataToast from "../ui/NewDataToast";
import AlertModal from "../ui/AlertModal";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fcmNotification, setFcmNotification] = useState(null);
  const [newDataToast, setNewDataToast] = useState(null);
  const [alertModal, setAlertModal] = useState(null);

  const { currentIpalId } = useIPAL();

  // Callback: new water quality reading arrived (real-time, not initial load)
  const handleNewData = useCallback((data) => {
    console.log("📊 New data toast triggered:", data.id);
    setNewDataToast(data);
  }, []);

  // Callback: new alert detected
  const handleNewAlert = useCallback((alert) => {
    console.log("🚨 Alert modal triggered:", alert.id);
    setAlertModal(alert);
  }, []);

  // Listen to real-time readings for current IPAL
  useRealtimeLatestReading(currentIpalId, { onNewData: handleNewData });

  // Listen to real-time alerts for current IPAL
  useRealtimeAlerts(currentIpalId, { onNewAlert: handleNewAlert });

  // ⭐ FCM Push Notification — init di sini karena hanya render saat user sudah login
  useFCM({
    onForegroundMessage: (payload) => {
      // If it's an alert notification from FCM, show AlertModal instead of toast
      if (payload.data?.type === "alert" || payload.data?.alert_id) {
        setAlertModal({
          ipal_id: payload.data?.ipal_id,
          parameter: payload.data?.parameter,
          severity: payload.data?.severity || "high",
          message: payload.notification?.body || "",
          value: payload.data?.value ? parseFloat(payload.data.value) : null,
          threshold: payload.data?.threshold,
          location: payload.data?.location,
        });
      } else {
        // Regular FCM notification → use floating toast
        setFcmNotification({
          title: payload.notification?.title || "New Notification",
          body: payload.notification?.body || "",
        });
        setTimeout(() => setFcmNotification(null), 8000);
      }
    },
  });

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50/80 via-cyan-50/70 to-sky-100/60 overflow-hidden backdrop-blur-3xl">
      {/* New Data Toast — slides in from right */}
      <NewDataToast
        data={newDataToast}
        onDismiss={() => setNewDataToast(null)}
      />

      {/* Alert Toast — slides in from right */}
      <AlertModal alert={alertModal} onDismiss={() => setAlertModal(null)} />

      {/* FCM Foreground Toast Notification (fallback for non-alert FCM) */}
      {fcmNotification && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full animate-slide-in">
          <div className="bg-white border border-cyan-200 rounded-xl shadow-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-cyan-100 rounded-full flex-shrink-0">
                <span className="text-lg">🔔</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {fcmNotification.title}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {fcmNotification.body}
                </p>
              </div>
              <button
                onClick={() => setFcmNotification(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Navbar - seamless dengan sidebar */}
        <Navbar setSidebarOpen={setSidebarOpen} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-b from-transparent via-blue-50/10 to-cyan-50/20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
