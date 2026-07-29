import RoleRouteMap from "@/router/roleRoutes";
import type { UserRole } from "@/router/roleRoutes";
import { routes } from "@/router/routes.config";
import type { AppRoute } from "@/router/routes.config";

export const getRoutesByRole = (role: UserRole): AppRoute[] => {
  const keys = RoleRouteMap[role] || [];

  return keys
    .map((key) => routes[key])
    .filter(Boolean)
};
