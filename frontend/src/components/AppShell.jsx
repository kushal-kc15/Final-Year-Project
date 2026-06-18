import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export function AppShell() {
  const { token } = useAuth();
  const [badges, setBadges] = useState({});

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    api.get('/expenses/pending_approvals/')
      .then((r) => {
        if (cancelled) return;
        const total = r.data?.count ?? r.data?.total ?? r.data?.length ?? 0;
        if (total) setBadges((b) => ({ ...b, pendingApprovals: total }));
      })
      .catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="min-h-screen flex bg-paper">
      <Sidebar badges={badges} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
