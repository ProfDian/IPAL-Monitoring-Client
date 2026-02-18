// src/components/layout/DashboardLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import useFCM from "../../hooks/useFCM";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fcmNotification, setFcmNotification] = useState(null);

  // ⭐ FCM Push Notification — init di sini karena hanya render saat user sudah login
  useFCM({
    onForegroundMessage: (payload) => {
      // Tampilkan toast notification di dalam app (bukan alert())
      setFcmNotification({
        title: payload.notification?.title || "New Notification",
        body: payload.notification?.body || "",
      });
      // Auto-dismiss setelah 8 detik
      setTimeout(() => setFcmNotification(null), 8000);
    },
  });

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50/80 via-cyan-50/70 to-sky-100/60 overflow-hidden backdrop-blur-3xl">
      {/* FCM Foreground Toast Notification */}
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
