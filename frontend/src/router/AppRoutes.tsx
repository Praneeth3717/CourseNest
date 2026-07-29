import { Routes, Route, Navigate } from "react-router-dom";

import { publicRoutes } from "@/router/routes.config";
import { getRoutesByRole } from "@/router/getRoutesByRole";

import DashboardLayout from "@/layouts/DashboardLayout/DashboardLayout";

import ProtectedRoute from "@/router/ProtectedRoute";

import { useAppSelector } from "@/store/hooks";

import type { RootState } from "@/store";
import type { UserRole } from "@/router/roleRoutes";

const AppRoutes = () => {
  const { isAuthenticated, role } = useAppSelector(
    (state: RootState) => state.auth
  );

  const allowedRoutes = role
    ? getRoutesByRole(role as UserRole)
    : [];

  const defaultRoute =
    allowedRoutes.find((r) => r.isDefault)?.path ||
    allowedRoutes[0]?.path ||
    "/login";

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      {!isAuthenticated &&
        publicRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={route.element}
          />
        ))}

      {/* PROTECTED ROUTES */}
      {isAuthenticated && role && (
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout role={role as UserRole} />
            </ProtectedRoute>
          }
        >
          {allowedRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.element}
            />
          ))}
        </Route>
      )}

      {/* FALLBACK */}
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? defaultRoute : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
};

export default AppRoutes;