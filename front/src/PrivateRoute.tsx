import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./auth";

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}
