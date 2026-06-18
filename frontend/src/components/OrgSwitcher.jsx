import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Building2 } from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { cn } from '../lib/utils.js';

/**
 * OrgSwitcher — flat dropdown, hairline-ruled, not a floating panel.
 * The selected org is the one in the chip. Clicking reveals the list with
 * a small +Create option at the bottom.
 */
export function OrgSwitcher() {
  const { organization, setOrganization, applyAuth, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open || !token) return;
    setLoading(true);
    api.get('/organizations/')
      .then((r) => setOrgs(Array.isArray(r.data) ? r.data : r.data?.results ?? []))
      .catch(() => setOrgs([]))
      .finally(() => setLoading(false));
  }, [open, token]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSelect = async (org) => {
    if (org.id === organization?.id) {
      setOpen(false);
      return;
    }
    try {
      const res = await api.post(`/organizations/${org.id}/switch/`);
      applyAuth(res.data);
    } catch {
      // Fall back to local switch if endpoint not implemented.
      setOrganization(org);
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
        <ChevronDown size={14} className={cn('text-ink-muted transition-transform', open && 'rotate-180')} strokeWidth={1.5} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 max-w-[calc(100vw-1.5rem)] bg-paper border border-rule rounded-md shadow-lift overflow-hidden animate-drawer">
          <p className="px-3 py-2 text-micro uppercase tracking-eyebrow text-ink-muted border-b border-rule">
            Your workspaces
          </p>
          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            {loading && (
              <li className="px-3 py-2 text-sm text-ink-muted">Loading…</li>
            )}
            {!loading && orgs.length === 0 && (
              <li className="px-3 py-2 text-sm text-ink-muted">No workspaces yet.</li>
            )}
            {orgs.map((org) => {
              const active = org.id === organization?.id;
              return (
                <li key={org.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(org)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-paper-deep transition-colors',
                      active && 'bg-paper-deep'
                    )}
                    role="option"
                    aria-selected={active}
                  >
                    <Building2 size={14} className="text-ink-muted shrink-0" strokeWidth={1.5} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{org.name}</p>
                      {org.role && <p className="text-[11px] text-ink-muted">{org.role}</p>}
                    </div>
                    {active && <Check size={14} className="text-cinnabar-500" strokeWidth={1.75} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
