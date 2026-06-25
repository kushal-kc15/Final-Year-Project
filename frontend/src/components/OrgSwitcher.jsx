import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check, Building2, Plus } from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { cn } from '../lib/utils.js';

export function OrgSwitcher() {
  const { organization, memberships, token, switchOrganization } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(memberships ?? []);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setItems(memberships ?? []);
  }, [memberships]);

  useEffect(() => {
    if (!open || !token) return;
    setLoading(true);
    api.get('/organizations/memberships/')
      .then((r) => setItems(Array.isArray(r.data?.memberships) ? r.data.memberships : []))
      .catch(() => setItems(memberships ?? []))
      .finally(() => setLoading(false));
  }, [memberships, open, token]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSelect = async (membership) => {
    const org = membership.organization ?? {
      id: membership.organization_id,
      name: membership.organization_name,
    };
    if (String(org.id) === String(organization?.id)) {
      setOpen(false);
      return;
    }
    try {
      await switchOrganization(org.id);
      navigate(window.location.pathname, { replace: true });
    } catch {
      // Keep the old workspace selected if the backend rejects the switch.
    }
    setOpen(false);
  };

  return (
    <div className="relative min-w-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex max-w-[9.5rem] items-center gap-2 h-8 pl-2.5 pr-2 border border-rule-strong rounded-sm bg-paper text-sm hover:bg-paper-deep transition-colors sm:max-w-[14rem]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Building2 size={14} className="text-ink-muted" strokeWidth={1.5} />
        <span className="min-w-0 truncate font-medium text-ink">{organization?.name ?? 'No workspace'}</span>
        <ChevronDown size={14} className={cn('text-ink-muted transition-transform duration-200', open && 'rotate-180')} strokeWidth={1.5} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 max-w-[calc(100vw-1.5rem)] bg-paper border border-rule rounded-md shadow-lift overflow-hidden animate-drawer origin-top-right">
          <p className="px-3 py-2 text-micro uppercase tracking-eyebrow text-ink-muted border-b border-rule">
            Your workspaces
          </p>
          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            {loading && (
              <li className="px-3 py-2 text-sm text-ink-muted">Loading…</li>
            )}
            {!loading && items.length === 0 && (
              <li className="px-3 py-2 text-sm text-ink-muted">No workspaces yet.</li>
            )}
            {items.map((membership) => {
              const org = membership.organization ?? {
                id: membership.organization_id,
                name: membership.organization_name,
              };
              const active = String(org.id) === String(organization?.id);
              return (
                <li key={membership.id ?? org.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(membership)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors relative',
                      'hover:bg-paper-deep',
                      active && 'bg-paper-deep'
                    )}
                    role="option"
                    aria-selected={active}
                  >
                    <Building2 size={14} className="text-ink-muted shrink-0" strokeWidth={1.5} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{org.name}</p>
                      {membership.role && <p className="text-[11px] text-ink-muted">{membership.role}</p>}
                    </div>
                    {active && <Check size={14} className="text-forest" strokeWidth={1.75} />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-rule px-3 py-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/workspace/start');
              }}
              className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
            >
              <Plus size={14} strokeWidth={1.5} />
              Switch workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
