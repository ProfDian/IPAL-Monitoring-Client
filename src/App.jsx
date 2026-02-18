// src/App.jsx
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { IPALProvider } from "./context/IPALContext";

// ⚡ Eager load - Always needed
import Login from "./pages/Login";
import ClearCache from "./pages/ClearCache";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import { LoadingScreen } from "./components/ui";

// ⚡ Lazy load pages - Load on demand
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Sensors = lazy(() => import("./pages/Sensors"));
const SensorDetail = lazy(() => import("./pages/SensorDetail"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Reports = lazy(() => import("./pages/Reports"));
const ManageIPAL = lazy(() => import("./pages/ManageIPAL"));
const ManageSensor = lazy(() => import("./pages/ManageSensor"));
const ManageUser = lazy(() => import("./pages/ManageUser"));
const AccountInfo = lazy(() => import("./pages/AccountInfo"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  // ⭐ FCM sekarang diinisialisasi di DashboardLayout (hanya saat user sudah login)

  return (
    <IPALProvider>
      <Suspense fallback={<LoadingScreen message="Loading..." />}>
        <Routes>
          {/* Auth pages */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/clear-cache" element={<ClearCache />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sensors" element={<Sensors />} />
            <Route path="/sensors/:id" element={<SensorDetail />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />

            {/* Admin Management Routes */}
            <Route path="/manage/ipal" element={<ManageIPAL />} />
            <Route path="/manage/sensors" element={<ManageSensor />} />
            <Route path="/manage/users" element={<ManageUser />} />
            <Route path="/account" element={<AccountInfo />} />
          </Route>

          {/* 404 Not Found - catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </IPALProvider>
  );
}

export default App;
