import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  LockKeyhole,
  Monitor,
  Palette,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import api from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';
import { Panel, PanelBody, PanelHeader } from '../components/Panel.jsx';
import Button from '../components/Button.jsx';
import { Input, Select, Textarea } from '../components/Field.jsx';
import { cn } from '../lib/utils.js';
import { formatDate } from '../lib/date.js';

const SECTIONS = [
  { value: 'profile', label: 'Profile', description: 'Personal identity', icon: UserRound },
  { value: 'account', label: 'Account', description: 'Email and password', icon: LockKeyhole },
  { value: 'workspace', label: 'Workspace', description: 'Active organization', icon: Building2 },
  { value: 'preferences', label: 'Preferences', description: 'Display and theme', icon: Palette },
  { value: 'danger', label: 'Danger zone', description: 'Careful actions', icon: AlertTriangle },
];

const CURRENCY_OPTIONS = ['NPR', 'USD', 'EUR'];
const THEME_OPTIONS = ['light', 'dark', 'system'];
const COUNTRY_OPTIONS = ['Nepal', 'India', 'United States', 'United Kingdom', 'Australia'];

const roleName = (role) => {
  const normalized = String(role ?? '').toUpperCase();
  if (normalized === 'OWNER') return 'Owner';
  if (normalized === 'STAFF') return 'Staff';
  return 'Member';
};

const fieldErrors = (data) => {
  const errors = {};
  if (data && typeof data === 'object') {
    Object.entries(data).forEach(([key, value]) => {
      errors[key] = Array.isArray(value) ? value[0] : String(value);
    });
  }
  return errors;
};

const normalizeCurrency = (currency) => (CURRENCY_OPTIONS.includes(currency) ? currency : 'NPR');
const normalizeTheme = (theme) => (THEME_OPTIONS.includes(theme) ? theme : 'system');
const fullName = (user) => [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
const initials = (user) => {
  const name = fullName(user) || user?.email || 'User';
  return name
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
};

export default function Settings() {
  const { role, organization, user } = useAuth();
  const [section, setSection] = useState('profile');
  const isOwner = String(role ?? '').toUpperCase() === 'OWNER';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
      <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Panel className="overflow-hidden">
            <nav className="flex gap-1 overflow-x-auto p-2 lg:block lg:space-y-1" aria-label="Settings sections">
              {SECTIONS.map((item) => {
                const Icon = item.icon;
                const active = section === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSection(item.value)}
                    className={cn(
                      'flex min-w-[9rem] items-center gap-2 rounded-sm px-3 py-2 text-left transition-colors lg:w-full',
                      active ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-paper-deep hover:text-ink',
                    )}
                  >
                    <Icon size={16} strokeWidth={1.7} className={active ? 'text-paper' : 'text-ink-muted'} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{item.label}</span>
                      <span className={cn('hidden text-[11px] lg:block', active ? 'text-paper/70' : 'text-ink-muted')}>
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </Panel>

          <Panel className="mt-3 hidden lg:block">
            <PanelBody dense>
              <p className="text-xs uppercase tracking-eyebrow text-ink-muted">Active workspace</p>
              <p className="mt-1 truncate text-sm font-medium text-ink">{organization?.name ?? 'No workspace selected'}</p>
              <p className="mt-1 text-xs text-ink-muted">
                Controls use your role in this workspace: {roleName(role)}.
              </p>
            </PanelBody>
          </Panel>
        </aside>

        <main className="min-w-0 space-y-4">
          <IdentityStrip user={user} role={role} organization={organization} />
          {section === 'profile' && <ProfileSection />}
          {section === 'account' && <AccountSection />}
          {section === 'workspace' && <WorkspaceSection isOwner={isOwner} />}
          {section === 'preferences' && <PreferencesSection />}
          {section === 'danger' && <DangerSection isOwner={isOwner} />}
        </main>
      </div>
    </div>
  );
}

function IdentityStrip({ user, role, organization }) {
  return (
    <Panel>
      <PanelBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-rule bg-forest-600 text-sm font-semibold text-paper">
            {initials(user)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-medium text-ink">{fullName(user) || 'Account profile'}</p>
            <p className="truncate text-sm text-ink-muted">{user?.email ?? 'Email unavailable'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-[17rem]">
          <MetaPill label="Role" value={roleName(role)} />
          <MetaPill label="Workspace" value={organization?.name ?? 'None'} />
        </div>
      </PanelBody>
    </Panel>
  );
}

function MetaPill({ label, value }) {
  return (
    <div className="rounded-sm border border-rule bg-paper-deep px-3 py-2">
      <p className="text-[10px] uppercase tracking-eyebrow text-ink-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function InlineError({ error }) {
  if (!error) return null;
  return (
    <div className="rounded-sm border border-cinnabar-200 bg-cinnabar-50 px-3 py-2 text-sm text-cinnabar-700">
      {error}
    </div>
  );
}

function ReadOnlyField({ label, value, help }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <div className="min-h-10 border-b border-rule py-2 text-sm text-ink">
        {value || <span className="text-ink-muted">Not set</span>}
      </div>
      {help && <p className="field-help">{help}</p>}
    </div>
  );
}

function ProfileSection() {
  const { user, applyAuth } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    business_name: user?.business_name ?? '',
    phone_number: user?.phone_number ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState({});

  useEffect(() => {
    setForm({
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      business_name: user?.business_name ?? '',
      phone_number: user?.phone_number ?? '',
    });
  }, [user]);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setErr({});
    setSaving(true);
    try {
      const res = await api.patch('/auth/profile/', form);
      applyAuth({ user: res.data.user ?? res.data });
      toast.success('Profile updated.');
    } catch (error) {
      const errors = fieldErrors(error?.response?.data);
      if (Object.keys(errors).length) setErr(errors);
      else toast.error('Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <PanelHeader
        title="Personal profile"
        subtitle="These details belong to your user account and stay the same across workspaces."
      />
      <form onSubmit={submit} className="space-y-5 p-4 sm:p-5" noValidate>
        <InlineError error={err.detail || err.error || err.non_field_errors} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First name" value={form.first_name} onChange={update('first_name')} error={err.first_name} />
          <Input label="Last name" value={form.last_name} onChange={update('last_name')} error={err.last_name} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Email" value={user?.email} help="Email is your login identity and is not edited here." />
          <Input label="Phone number" value={form.phone_number} onChange={update('phone_number')} error={err.phone_number} />
        </div>
        <Input label="Business/profile label" value={form.business_name} onChange={update('business_name')} error={err.business_name} help="Optional account-level label, not the active workspace name." />
        <div className="flex justify-end border-t border-rule pt-4">
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function AccountSection() {
  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Account identity"
          subtitle="Your email identifies your account across every organization you belong to."
          action={<ShieldCheck size={20} className="text-forest" strokeWidth={1.7} />}
        />
        <PanelBody>
          <AccountIdentity />
        </PanelBody>
      </Panel>
      <PasswordCard />
    </div>
  );
}

function AccountIdentity() {
  const { user } = useAuth();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ReadOnlyField label="Email address" value={user?.email} />
      <ReadOnlyField label="Username" value={user?.username} help="Generated automatically for system compatibility." />
      <ReadOnlyField label="Two-factor status" value={user?.two_factor_enabled ? 'Enabled' : 'Not enabled'} />
      <ReadOnlyField label="Account created" value={user?.created_at ? formatDate(user.created_at) : ''} />
    </div>
  );
}

function PasswordCard() {
  const toast = useToast();
  const [pw, setPw] = useState({ current: '', next: '', next2: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState({});

  const submit = async (event) => {
    event.preventDefault();
    setErr({});
    if (pw.next !== pw.next2) {
      setErr({ next2: 'New passwords do not match.' });
      return;
    }
    if (pw.next.length < 8) {
      setErr({ next: 'Use at least 8 characters.' });
      return;
    }

    setSaving(true);
    try {
      await api.post('/auth/change-password/', {
        old_password: pw.current,
        new_password: pw.next,
      });
      toast.success('Password changed.');
      setPw({ current: '', next: '', next2: '' });
    } catch (error) {
      const data = error?.response?.data;
      const errors = fieldErrors(data);
      if (Object.keys(errors).length) setErr(errors);
      else setErr({ detail: data?.detail || 'Could not change the password.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <PanelHeader title="Password and security" subtitle="Update the password for this user account." />
      <form onSubmit={submit} className="space-y-4 p-4 sm:max-w-xl sm:p-5" noValidate>
        <InlineError error={err.detail || err.error || err.non_field_errors} />
        <Input type="password" label="Current password" value={pw.current} onChange={(event) => setPw((current) => ({ ...current, current: event.target.value }))} required autoComplete="current-password" error={err.current ?? err.old_password} />
        <Input type="password" label="New password" value={pw.next} onChange={(event) => setPw((current) => ({ ...current, next: event.target.value }))} required autoComplete="new-password" error={err.next ?? err.new_password} />
        <Input type="password" label="Confirm new password" value={pw.next2} onChange={(event) => setPw((current) => ({ ...current, next2: event.target.value }))} required autoComplete="new-password" error={err.next2} />
        <div className="flex justify-end border-t border-rule pt-4">
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Update password'}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function WorkspaceSection({ isOwner }) {
  const { organization, role, applyAuth } = useAuth();
  const toast = useToast();
  const [workspace, setWorkspace] = useState(organization ?? null);
  const [form, setForm] = useState(() => workspaceForm(organization));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState({});
  const organizationId = organization?.id;

  useEffect(() => {
    let cancelled = false;
    setErr({});
    setWorkspace(organization ?? null);
    setForm(workspaceForm(organization));
    if (!organizationId) return undefined;

    setLoading(true);
    api.get(`/organizations/${organizationId}/`)
      .then((res) => {
        if (cancelled) return;
        setWorkspace(res.data);
        setForm(workspaceForm(res.data));
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load workspace details.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!organizationId) {
      setErr({ detail: 'Select or create an organization before saving workspace settings.' });
      return;
    }
    if (!isOwner) return;

    setErr({});
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        industry: form.industry,
        country: form.country,
        contact_email: form.contact_email,
        phone_number: form.phone_number,
        city: form.city,
        address: form.address,
      };
      const res = await api.patch(`/organizations/${organizationId}/`, payload);
      setWorkspace(res.data);
      setForm(workspaceForm(res.data));
      applyAuth({ organization: res.data });
      toast.success('Workspace updated.');
    } catch (error) {
      const errors = fieldErrors(error?.response?.data);
      if (Object.keys(errors).length) setErr(errors);
      else toast.error('Could not save workspace.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <PanelHeader
        title="Workspace information"
        subtitle="These settings belong only to the active organization."
        action={<RoleBadge role={role} />}
      />
      <form onSubmit={submit} className="space-y-5 p-4 sm:p-5" noValidate>
        <InlineError error={err.detail || err.error || err.non_field_errors} />
        {!isOwner && (
          <div className="rounded-sm border border-saffron-200 bg-saffron-50 px-3 py-2 text-sm text-saffron-800">
            Only workspace owners can update organization settings.
          </div>
        )}
        {loading && (
          <p className="text-sm text-ink-muted">Loading workspace details...</p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Workspace name" value={form.name} onChange={update('name')} required error={err.name} disabled={!isOwner || saving} />
          <Input label="Industry" value={form.industry} onChange={update('industry')} error={err.industry} disabled={!isOwner || saving} />
        </div>
        <Textarea label="Description" value={form.description} onChange={update('description')} error={err.description} disabled={!isOwner || saving} rows={3} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Contact email" type="email" value={form.contact_email} onChange={update('contact_email')} error={err.contact_email} disabled={!isOwner || saving} />
          <Input label="Phone number" value={form.phone_number} onChange={update('phone_number')} error={err.phone_number} disabled={!isOwner || saving} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="City" value={form.city} onChange={update('city')} error={err.city} disabled={!isOwner || saving} />
          <Select label="Country" value={form.country} onChange={update('country')} error={err.country} disabled={!isOwner || saving}>
            <option value="">Not set</option>
            {COUNTRY_OPTIONS.map((country) => <option key={country} value={country}>{country}</option>)}
            {form.country && !COUNTRY_OPTIONS.includes(form.country) && <option value={form.country}>{form.country}</option>}
          </Select>
        </div>
        <Textarea label="Address" value={form.address} onChange={update('address')} error={err.address} disabled={!isOwner || saving} rows={2} />
        <div className="grid grid-cols-1 gap-4 border-t border-rule pt-4 sm:grid-cols-3">
          <ReadOnlyField label="Current role" value={roleName(role)} />
          <ReadOnlyField label="Created" value={workspace?.created_at ? formatDate(workspace.created_at) : ''} />
          <ReadOnlyField label="Members" value={workspace?.member_count != null ? String(workspace.member_count) : ''} />
        </div>
        <div className="rounded-sm border border-rule bg-paper-deep px-3 py-2 text-xs text-ink-muted">
          Workspace currency and team size are not configured on the organization model. Display currency is managed under Preferences.
        </div>
        {isOwner && (
          <div className="flex justify-end border-t border-rule pt-4">
            <Button variant="primary" type="submit" disabled={saving || !organizationId}>
              {saving ? 'Saving...' : 'Save workspace'}
            </Button>
          </div>
        )}
      </form>
    </Panel>
  );
}

function workspaceForm(organization) {
  return {
    name: organization?.name ?? '',
    description: organization?.description ?? '',
    industry: organization?.industry ?? '',
    country: organization?.country ?? '',
    contact_email: organization?.contact_email ?? '',
    phone_number: organization?.phone_number ?? '',
    city: organization?.city ?? '',
    address: organization?.address ?? '',
  };
}

function RoleBadge({ role }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-rule bg-paper-deep px-2.5 text-xs font-medium text-ink">
      <BriefcaseBusiness size={14} strokeWidth={1.7} />
      {roleName(role)}
    </span>
  );
}

function PreferencesSection() {
  const { applyAuth, currency } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const toast = useToast();
  const [prefs, setPrefs] = useState({
    currency: normalizeCurrency(currency),
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState({});

  useEffect(() => {
    setPrefs((current) => ({ ...current, currency: normalizeCurrency(currency) }));
  }, [currency]);

  const save = async () => {
    setErr({});
    setSaving(true);
    try {
      const nextTheme = normalizeTheme(theme);
      const nextCurrency = normalizeCurrency(prefs.currency);
      await api.patch('/auth/preferences/', {
        default_currency: nextCurrency,
        theme_preference: nextTheme,
      });
      applyAuth({ currency: nextCurrency });
      setPrefs((current) => ({ ...current, currency: nextCurrency }));
      toast.success('Preferences saved.');
    } catch (error) {
      const errors = fieldErrors(error?.response?.data);
      if (Object.keys(errors).length) setErr(errors);
      else toast.error('Could not save preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <PanelHeader
        title="Preferences"
        subtitle="Personal display settings. These follow your account across workspaces."
        action={<Monitor size={20} className="text-ink-muted" strokeWidth={1.7} />}
      />
      <PanelBody className="space-y-5">
        <InlineError error={err.detail || err.error || err.non_field_errors} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Display currency" value={prefs.currency} onChange={(event) => setPrefs((current) => ({ ...current, currency: normalizeCurrency(event.target.value) }))} error={err.default_currency ?? err.currency}>
            {CURRENCY_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <ReadOnlyField label="Resolved theme" value={resolvedTheme === 'dark' ? 'Dark' : 'Light'} />
        </div>

        <div className="rounded-md border border-rule bg-paper-deep p-3">
          <p className="text-sm font-medium text-ink">Appearance</p>
          <p className="mt-0.5 text-xs text-ink-muted">
            Theme changes apply immediately. Saving stores the preference with your account.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((item) => {
              const active = normalizeTheme(theme) === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTheme(item)}
                  className={cn(
                    'rounded-sm border px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
                    active ? 'border-forest-600 bg-forest-600 text-paper' : 'border-rule bg-paper text-ink-soft hover:bg-paper-deep hover:text-ink',
                  )}
                >
                  {item === 'system' ? 'System' : item[0].toUpperCase() + item.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end border-t border-rule pt-4">
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save preferences'}
          </Button>
        </div>
      </PanelBody>
    </Panel>
  );
}

function DangerSection({ isOwner }) {
  const { logout, organization, refreshSession } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [err, setErr] = useState('');

  const leaveWorkspace = async () => {
    if (!organization?.id || !confirmLeave) return;
    setErr('');
    setLeaving(true);
    try {
      await api.post(`/organizations/${organization.id}/leave/`);
      const next = await refreshSession();
      toast.success(`You left ${organization.name}.`);
      navigate(next?.organization ? '/dashboard' : '/workspace/start', { replace: true });
    } catch (error) {
      const message = error?.response?.data?.error || error?.response?.data?.detail || 'Could not leave this workspace.';
      setErr(message);
      toast.error(message);
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Danger zone"
          subtitle="Careful account and workspace actions."
          action={<AlertTriangle size={20} className="text-saffron-600" strokeWidth={1.7} />}
        />
        <PanelBody className="space-y-4">
          <div className="rounded-sm border border-rule bg-paper-deep px-3 py-2 text-sm text-ink-muted">
            Workspace deletion is intentionally not available from this screen.
            {isOwner ? ' Owners can manage members and invitations from Team.' : ' Staff can leave a workspace but cannot manage organization settings.'}
          </div>
          <div className="rounded-sm border border-cinnabar-200 bg-paper p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Leave current workspace</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  This removes only your membership in {organization?.name ?? 'the active workspace'}. Other workspaces stay available.
                </p>
                {isOwner && (
                  <p className="mt-1 text-xs text-cinnabar-700">
                    Last-owner protection is enforced by the backend.
                  </p>
                )}
              </div>
              <Button
                variant="danger"
                type="button"
                onClick={leaveWorkspace}
                disabled={!organization?.id || !confirmLeave || leaving}
              >
                {leaving ? 'Leaving...' : 'Leave workspace'}
              </Button>
            </div>
            <label className="mt-3 flex items-start gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={confirmLeave}
                onChange={(event) => setConfirmLeave(event.target.checked)}
                className="mt-0.5"
              />
              <span>I understand this only affects my membership in the active workspace.</span>
            </label>
            {err && <p className="mt-2 text-xs text-cinnabar-700">{err}</p>}
          </div>
          <div className="flex flex-col gap-3 rounded-sm border border-rule p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Sign out</p>
              <p className="mt-0.5 text-xs text-ink-muted">End this session on the current device.</p>
            </div>
            <Button variant="secondary" type="button" onClick={logout}>Sign out</Button>
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
