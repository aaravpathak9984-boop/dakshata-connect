import type { ReactElement } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { canAccessAdminArea, isAdmin, isLecturer } from "@/lib/roles";

/**
 * Gates authenticated routes.
 * Optionally pass `allowedRoles` to restrict to specific Firestore-verified roles.
 */
export function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] } = {}) {
  const { user, isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) return <FullScreenLoader />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  // If specific roles are required, verify against the Firestore-sourced roles
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.includes(user.role) || user.roles.some((r) => allowedRoles.includes(r));
    if (!hasAllowedRole) {
      // Redirect unauthorized users to their natural landing page
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}

/** Gates the admin area to admins and lecturers (lecturers get the course tools). */
export function AdminAreaRoute() {
  const { user, isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) return <FullScreenLoader />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  // Strict Firestore role check — only Admin or approved Trainer roles
  if (!canAccessAdminArea(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

/** Restricts a page within the admin area to admins; lecturers go to courses. */
export function RequireAdmin({ children }: { children: ReactElement }) {
  const { user } = useAuth();
  return isAdmin(user) ? children : <Navigate to="/admin/courses" replace />;
}

/** Routes each role to its natural landing page after sign-in. */
export function HomeRedirect() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) return <FullScreenLoader />;

  const target = isAdmin(user) ? "/admin" : isLecturer(user) ? "/admin/courses" : "/dashboard";
  return <Navigate to={target} replace />;
}

/** For routes that should be hidden once signed in (login/register). */
export function PublicOnlyRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) return <FullScreenLoader />;

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}
