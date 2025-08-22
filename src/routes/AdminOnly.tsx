// src/routes/AdminOnly.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AdminOnly() {
  const { user, loading } = useAuth();

  if (loading) return null;               // ya cargará Private
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return <Navigate to="/" replace />;

  return <Outlet />;
}
