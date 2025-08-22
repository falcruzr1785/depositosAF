// src/routes/Private.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Private() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Mientras verificamos el estado (evita parpadeos)
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
        <div className="mt-2">Cargando…</div>
      </div>
    );
  }

  // Si no hay usuario => redirige a /login y recuerda la ruta origen
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si hay usuario, renderiza las rutas hijas
  return <Outlet />;
}
