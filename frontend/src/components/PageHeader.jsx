import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function PageHeader({ title, children }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 h-16 flex items-center justify-between shrink-0">
      <h1 className="font-display text-lg font-700 text-slate-900">{title}</h1>
      <div className="flex items-center gap-3">
        {children}
        <NotificationBell />
        <div className="w-px h-5 bg-slate-200" />
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.username}</p>
            <p className="text-[11px] text-slate-400 leading-tight">{user?.business_name || 'Business'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
