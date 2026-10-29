import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Spinner } from "@/components/ui/Spinner";

const HomePage = lazy(() => import("@/pages/HomePage"));
const LoginPage = lazy(() => import("@/features/auth/LoginPage"));
const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));
const ModuleRoute = lazy(() => import("@/app/ModuleRoute"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const PageLoader = () => (
  <main className="app-loading">
    <Spinner size="lg" />
  </main>
);

export const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path=":moduleId" element={<ModuleRoute />} />
      </Route>

      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);
