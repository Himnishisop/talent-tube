import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "./ui";
import type { UserRole } from "@/lib/types";

/** Requires any signed-in user (optionally a specific role). */
export function RequireAuth({ roles }: { roles?: UserRole[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label="Checking session…" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

/**
 * Admin-only guard. Note: this is UX only – the real protection is in
 * firestore.rules (role == "admin" in users/{uid}).
 */
export function RequireAdmin() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Spinner label="Checking session…" />;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
