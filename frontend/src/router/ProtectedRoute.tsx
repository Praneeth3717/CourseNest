import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import type { ReactNode } from "react";
import type { RootState } from "@/store/index"

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const {isAuthenticated} = useAppSelector((state: RootState) => state.auth);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;