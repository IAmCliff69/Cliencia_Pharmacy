import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  /** If provided, only these roles may access this route. */
  allowedRoles?: Array<"staff" | "admin">;
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Auth state hasn't resolved yet (we're still checking the stored
  // token against /auth/me). Render nothing meaningful here rather
  // than redirecting prematurely — otherwise a logged-in user gets
  // bounced to /login for a split second on every refresh.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Logged in, but wrong role (e.g. staff trying to hit an
    // admin-only route). Send them somewhere valid rather than
    // showing a blank/broken page.
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;