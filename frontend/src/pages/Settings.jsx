import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';
import { Panel, PanelHeader, PanelTitle } from '../components/Panel.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import Button from '../components/Button.jsx';
import { Input, Select } from '../components/Field.jsx';

const TABS = [
  { value: 'profile', label: 'Profile' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'preferences', label: 'Preferences' },
  { value: 'security', label: 'Security' },
];

const roleLabel = (role) => {
  const normalized = String(role ?? '').toUpperCase();
  if (normalized === 'OWNER') return 'Owner settings';
  if (normalized === 'STAFF') return 'Staff settings';
  return 'Workspace settings';
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

const CURRENCY_OPTIONS = ['NPR', 'USD', 'EUR'];
const THEME_OPTIONS = ['system', 'light', 'dark'];

const normalizeCurrency = (currency) => (CURRENCY_OPTIONS.includes(currency) ? currency : 'NPR');
const normalizeTheme = (theme) => (THEME_OPTIONS.includes(theme) ? theme : 'system');

export default function Settings() {
  const { role, organization } = useAuth();
  const [tab, setTab] = useState('profile');
  const isStaff = String(role ?? '').toUpperCase() === 'STAFF';

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
      <PageHeader
        byline={`${roleLabel(role)}${organization?.name ? ` - ${organization.name}` : ''}`}
        title="Settings"
        lede="Manage your profile, workspace, and preferences."
      />

      {isStaff && (
        <div className="mt-3 rounded-sm border border-rule bg-paper-deep px-3 py-2 text-sm text-ink-soft">
          Some workspace settings are owner-managed. Backend permissions still apply.
        </div>
      )}

      {!organization?.id && (
        <div className="mt-3 rounded-sm border border-rule bg-paper-deep px-3 py-2 text-sm text-ink-soft">
          Select an organization before saving workspace settings.
        </div>
      )}

      <div className="mt-3 overflow-x-auto border-b border-rule">
        <div className="flex min-w-max items-center gap-1">
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={
                'h-9 shrink-0 px-3 text-sm transition-colors ' +
                (tab === item.value
                  ? 'text-ink font-medium border-b-2 border-cinnabar-500 -mb-px'
                  : 'text-ink-muted hover:text-ink')
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {tab === 'profile' && <Profile />}
        {tab === 'workspace' && <Workspace />}
        {tab === 'preferences' && <Preferences />}
        {tab === 'security' && <Security />}
      </div>
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

function Profile() {
  const { user, applyAuth } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    email: user?.email ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState({});

  useEffect(() => {
    setForm({
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      email: user?.email ?? '',
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
      const data = error?.response?.data;
      const errors = fieldErrors(data);
      if (Object.keys(errors).length) setErr(errors);
      else toast.error('Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle>Profile</PanelTitle>
          <p className="text-xs text-ink-muted mt-0.5">Account details for this workspace.</p>
        </div>
      </PanelHeader>
      <form onSubmit={submit} className="space-y-4 max-w-md p-4 sm:p-5" noValidate>
        <InlineError error={err.detail || err.error || err.non_field_errors} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First name" value={form.first_name} onChange={update('first_name')} error={err.first_name} />
          <Input label="Last name" value={form.last_name} onChange={update('last_name')} error={err.last_name} />
        </div>
        <Input type="email" label="Email" value={form.email} onChange={update('email')} required error={err.email} />
        <div className="pt-2">
          <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</Button>
        </div>
      </form>
    </Panel>
  );
}

function Workspace() {
  const { organization, applyAuth } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: organization?.name ?? '',
    description: organization?.description ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState({});

  useEffect(() => {
    setForm({
      name: organization?.name ?? '',
      description: organization?.description ?? '',
    });
  }, [organization]);

  const submit = async (event) => {
    event.preventDefault();
    if (!organization?.id) {
      setErr({ detail: 'Select or create an organization before saving workspace settings.' });
      return;
    }

    setErr({});
    setSaving(true);
    try {
      const res = await api.patch(`/organizations/${organization.id}/`, {
        name: form.name,
        description: form.description,
      });
      applyAuth({ organization: res.data });
      toast.success('Workspace updated.');
    } catch (error) {
      const data = error?.response?.data;
      const errors = fieldErrors(data);
      if (Object.keys(errors).length) setErr(errors);
      else toast.error('Could not save workspace.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle>Workspace</PanelTitle>
          <p className="text-xs text-ink-muted mt-0.5">Workspace name and description.</p>
        </div>
      </PanelHeader>
      <form onSubmit={submit} className="space-y-4 max-w-lg p-4 sm:p-5" noValidate>
        <InlineError error={err.detail || err.error || err.non_field_errors} />
        <Input label="Workspace name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required error={err.name} />
        <Input label="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} error={err.description} />
        <div className="flex flex-col gap-3 border-t border-rule pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">Only name and description are saved.</p>
          <Button variant="primary" type="submit" disabled={saving || !organization?.id}>
            {saving ? 'Saving...' : 'Save workspace'}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function Preferences() {
  const { applyAuth, currency } = useAuth();
  const toast = useToast();
  const [prefs, setPrefs] = useState({
    currency: normalizeCurrency(currency),
    theme: normalizeTheme('system'),
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState({});

  useEffect(() => {
    setPrefs((current) => ({
      ...current,
      currency: normalizeCurrency(currency),
      theme: normalizeTheme(current.theme),
    }));
  }, [currency]);

  const save = async () => {
    setErr({});
    setSaving(true);
    try {
      const nextTheme = normalizeTheme(prefs.theme);
      const nextCurrency = normalizeCurrency(prefs.currency);
      await api.patch('/auth/preferences/', {
        default_currency: nextCurrency,
        theme_preference: nextTheme,
      });
      applyAuth({ currency: nextCurrency });
      setPrefs((current) => ({ ...current, currency: nextCurrency, theme: nextTheme }));
      toast.success('Preferences saved.');
    } catch (error) {
      const data = error?.response?.data;
      const errors = fieldErrors(data);
      if (Object.keys(errors).length) setErr(errors);
      else toast.error('Could not save preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle>Preferences</PanelTitle>
          <p className="text-xs text-ink-muted mt-0.5">Display defaults for your account.</p>
        </div>
      </PanelHeader>
      <div className="space-y-4 max-w-md p-4 sm:p-5">
        <InlineError error={err.detail || err.error || err.non_field_errors} />
        <Select label="Display currency" value={prefs.currency} onChange={(event) => setPrefs((current) => ({ ...current, currency: normalizeCurrency(event.target.value) }))} error={err.default_currency ?? err.currency}>
          {CURRENCY_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Select label="Theme preference" value={prefs.theme} onChange={(event) => setPrefs((current) => ({ ...current, theme: normalizeTheme(event.target.value) }))} error={err.theme_preference ?? err.theme}>
          {THEME_OPTIONS.map((item) => (
            <option key={item} value={item}>{item === 'system' ? 'System default' : item[0].toUpperCase() + item.slice(1)}</option>
          ))}
        </Select>
        <div className="flex flex-col gap-3 border-t border-rule pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">Only currency and theme are saved.</p>
          <Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save preferences'}</Button>
        </div>
      </div>
    </Panel>
  );
}

function Security() {
  const { logout } = useAuth();
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
      await api.post('/auth/change-password/', { old_password: pw.current, new_password: pw.next });
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
    <div className="space-y-4">
      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Password</PanelTitle>
            <p className="text-xs text-ink-muted mt-0.5">Update your account password.</p>
          </div>
        </PanelHeader>
        <form onSubmit={submit} className="space-y-4 max-w-md p-4 sm:p-5" noValidate>
          <InlineError error={err.detail || err.error || err.non_field_errors} />
          <Input type="password" label="Current password" value={pw.current} onChange={(event) => setPw((current) => ({ ...current, current: event.target.value }))} required autoComplete="current-password" error={err.current ?? err.old_password} />
          <Input type="password" label="New password" value={pw.next} onChange={(event) => setPw((current) => ({ ...current, next: event.target.value }))} required autoComplete="new-password" error={err.next ?? err.new_password} />
          <Input type="password" label="Confirm new password" value={pw.next2} onChange={(event) => setPw((current) => ({ ...current, next2: event.target.value }))} required autoComplete="new-password" error={err.next2} />
          <div className="pt-2">
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Update password'}</Button>
          </div>
        </form>
      </Panel>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Session</PanelTitle>
            <p className="text-xs text-ink-muted mt-0.5">Sign out of this device.</p>
          </div>
        </PanelHeader>
        <div className="p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-muted">Use this on shared or public devices.</p>
          <Button variant="secondary" type="button" onClick={logout}>Sign out</Button>
        </div>
      </Panel>
    </div>
  );
}
