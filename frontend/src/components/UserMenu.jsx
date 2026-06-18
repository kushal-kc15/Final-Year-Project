import { useEffect, useRef, useState } from 'react';
import { LogOut, Settings as SettingsIcon, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { Avatar } from './Avatar.jsx';
import { cn } from '../lib/utils.js';

export function UserMenu() {
  const { user, logout, role } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-8 pr-2 pl-1 border border-rule-strong rounded-sm bg-paper text-sm hover:bg-paper-deep transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={user?.full_name ?? user?.email ?? '?'} size={24} />
        <span className="hidden sm:inline max-w-[140px] truncate font-medium text-ink">
          {user?.full_name ?? user?.email ?? 'Account'}
        </span>
        <ChevronDown size={14} className={cn('text-ink-muted transition-transform', open && 'rotate-180')} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 max-w-[calc(100vw-1.5rem)] bg-paper border border-rule rounded-md shadow-lift overflow-hidden animate-drawer">
          <div className="px-3 py-2.5 border-b border-rule">
            <p className="text-sm font-medium text-ink truncate">{user?.full_name ?? '—'}</p>
            <p className="text-xs text-ink-muted truncate">{user?.email}</p>
            {role && (
              <p className="mt-1.5 text-micro uppercase tracking-eyebrow text-cinnabar-600">{role}</p>
            )}
          </div>
          <ul className="py-1">
            <li>
              <button
                type="button"
                onClick={() => { setOpen(false); navigate('/settings'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-soft hover:bg-paper-deep hover:text-ink transition-colors"
              >
                <UserIcon size={14} strokeWidth={1.5} />
                Profile
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => { setOpen(false); navigate('/settings'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-soft hover:bg-paper-deep hover:text-ink transition-colors"
              >
                <SettingsIcon size={14} strokeWidth={1.5} />
                Settings
              </button>
            </li>
            <li className="border-t border-rule mt-1 pt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-soft hover:bg-paper-deep hover:text-ink transition-colors"
              >
                <LogOut size={14} strokeWidth={1.5} />
                Sign out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
