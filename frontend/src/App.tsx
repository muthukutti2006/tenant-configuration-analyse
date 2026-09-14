import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/layout/Layout";
import { LoginPage }          from "./pages/LoginPage";
import { OverviewPage }       from "./pages/OverviewPage";
import { AnalyzePage }        from "./pages/AnalyzePage";
import { ConflictsPage }      from "./pages/ConflictsPage";
import { ConfigurationsPage } from "./pages/ConfigurationsPage";
import { RulesPage }          from "./pages/RulesPage";
import { ApproachPage }       from "./pages/ApproachPage";
import { AboutPage }          from "./pages/AboutPage";
import { DriftPage }          from "./pages/DriftPage";
import { CatalogPage }        from "./pages/CatalogPage";
import { ProfilePage }        from "./pages/ProfilePage";

/* ── ProtectedRoute: redirect to /login when not authenticated ───── */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

/* ── PublicRoute: redirect authenticated users away from /login ──── */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected — wrapped in Layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/"               element={<OverviewPage />} />
                <Route path="/analyze"        element={<AnalyzePage />} />
                <Route path="/conflicts"      element={<ConflictsPage />} />
                <Route path="/drift"          element={<DriftPage />} />
                <Route path="/configurations" element={<ConfigurationsPage />} />
                <Route path="/catalog"        element={<CatalogPage />} />
                <Route path="/rules"          element={<RulesPage />} />
                <Route path="/approach"       element={<ApproachPage />} />
                <Route path="/about"          element={<AboutPage />} />
                <Route path="/profile"        element={<ProfilePage />} />
                {/* Catch-all → dashboard */}
                <Route path="*"              element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
