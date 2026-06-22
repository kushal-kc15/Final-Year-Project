import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Spinner } from "./Feedback.jsx";

export function ProtectedRoute({ children, roles, requireOrg = true }) {
  const { user, token, loading, organization, role } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <Spinner size={20} className="text-ink-muted" />
      </div>
    );
  }
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  }
  if (requireOrg && !organization) {
    return <Navigate to="/workspace/start" replace />;
  }
  if (roles && roles.length && !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export function PublicOnly({ children }) {
  const { user, token, loading, organization } = useAuth();
  const [params] = useSearchParams();
  if (loading) return null;
  if (token && user) {
    const invite = params.get("invite");
    if (invite)
      return (
        <Navigate to={`/invite?token=${encodeURIComponent(invite)}`} replace />
      );
    return (
      <Navigate
        to={organization ? "/dashboard" : "/workspace/start"}
        replace
      />
    );
  }
  return children;
}
