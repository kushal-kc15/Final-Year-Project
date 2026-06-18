import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './Feedback.jsx';

export function ProtectedRoute({ children, roles, requireOrg = true }) {
  const { user, token, loading, organization, role, refreshSession } = useAuth();
  const [recoveringOrg, setRecoveringOrg] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    if (loading || !token || !user || organization || !requireOrg) return undefined;
    let cancelled = false;
    setRecoveringOrg(true);
    refreshSession()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRecoveringOrg(false);
      });
    return () => { cancelled = true; };
  }, [loading, organization, refreshSession, requireOrg, token, user]);

  if (loading || recoveringOrg) {
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
    return <Navigate to="/organization/setup" replace />;
  }
  if (roles && roles.length && !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export function PublicOnly({ children }) {
  const { user, token, loading } = useAuth();
  if (loading) return null;
  if (token && user) return <Navigate to="/dashboard" replace />;
  return children;
}
