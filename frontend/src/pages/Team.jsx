import { useEffect, useMemo, useState } from 'react';
import { Mail, Plus, RefreshCw, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { Panel, PanelHeader, PanelTitle } from '../components/Panel.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import Button from '../components/Button.jsx';
import { Input, Select } from '../components/Field.jsx';
import { Modal } from '../components/Modal.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { Badge } from '../components/Badge.jsx';
import { formatDate } from '../lib/date.js';
import { EmptyState, ErrorState, Spinner } from '../components/Feedback.jsx';
import PaginationControls from '../components/PaginationControls.jsx';

const ROLES = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'STAFF', label: 'Staff' },
];

const roleLabel = (role) => ROLES.find((item) => item.value === role)?.label ?? role ?? 'Member';

const pageRoleLabel = (role) => {
  const normalized = String(role ?? '').toUpperCase();
  if (normalized === 'OWNER') return 'Owner team management';
  if (normalized === 'STAFF') return 'Staff team view';
  return 'Workspace team management';
};

const memberName = (member) => (
  member?.user?.full_name
  ?? member?.user?.username
  ?? member?.user?.email
  ?? 'Team member'
);

const memberEmail = (member) => member?.user?.email ?? 'No email recorded';
const isPendingInvite = (invite) => String(invite?.status ?? '').toUpperCase() === 'PENDING';

export default function Team() {
  const { organization, user, role } = useAuth();
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [savingRoleId, setSavingRoleId] = useState(null);
  const [q, setQ] = useState('');

  const membersPageSize = 10;
  const [membersPage, setMembersPage] = useState(1);

  const invitesPageSize = 10;
  const [invitesPage, setInvitesPage] = useState(1);

  const organizationId = organization?.id;
  const isExplicitStaff = String(role ?? '').toUpperCase() === 'STAFF';

  const refresh = () => {
    setLoading(true);
    setLoadErrors([]);

    const memberRequest = organizationId
      ? api.get(`/organizations/${organizationId}/members/`)
      : Promise.resolve({ data: [] });

    Promise.allSettled([
      memberRequest,
      api.get('/invitations/'),
    ])
      .then(([memberResult, inviteResult]) => {
        const errors = [];

        if (memberResult.status === 'fulfilled') {
          const data = memberResult.value.data?.results ?? memberResult.value.data ?? [];
          setMembers(Array.isArray(data) ? data : []);
        } else {
          errors.push('members');
          setMembers([]);
        }

        if (inviteResult.status === 'fulfilled') {
          const data = inviteResult.value.data?.results ?? inviteResult.value.data ?? [];
          const list = Array.isArray(data) ? data : [];
          setInvites(list.filter(isPendingInvite));
        } else {
          errors.push('invitations');
          setInvites([]);
        }

        setLoadErrors(errors);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setMembersPage(1);
    setInvitesPage(1);
  }, [q]);

  const summary = useMemo(() => {
    const ownerCount = members.filter((member) => member.role === 'OWNER').length;
    const staffCount = members.filter((member) => member.role === 'STAFF').length;
    return {
      ownerCount,
      staffCount,
      memberCount: members.length,
      inviteCount: invites.length,
    };
  }, [members, invites]);

  const filteredMembers = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((member) => `${memberName(member)} ${memberEmail(member)}`.toLowerCase().includes(needle));
  }, [members, q]);

  const filteredInvites = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return invites;
    return invites.filter((invite) => `${invite.email ?? ''} ${invite.role ?? ''}`.toLowerCase().includes(needle));
  }, [invites, q]);

  const pagedMembers = useMemo(() => {
    const start = (membersPage - 1) * membersPageSize;
    const end = start + membersPageSize;
    return filteredMembers.slice(start, end);
  }, [filteredMembers, membersPage]);

  const pagedInvites = useMemo(() => {
    const start = (invitesPage - 1) * invitesPageSize;
    const end = start + invitesPageSize;
    return filteredInvites.slice(start, end);
  }, [filteredInvites, invitesPage]);

  const hasSearch = q.trim().length > 0;
  const fullError = loadErrors.length === 2;
  const partialError = loadErrors.length > 0 && !fullError;

  const remove = async () => {
    if (!removeTarget || !organizationId) return;
    if (removeTarget.user?.id === user?.id) {
      toast.error('You cannot remove yourself.');
      return;
    }

    setRemoving(true);
    try {
      await api.delete(`/organizations/${organizationId}/remove_member/`, { data: { member_id: removeTarget.id } });
      toast.success('Member removed.');
      setRemoveTarget(null);
      refresh();
    } catch (error) {
      const data = error?.response?.data;
      const backendMessage = data?.detail || data?.error || data?.message || (Array.isArray(data?.non_field_errors) ? data.non_field_errors.join(' ') : data?.non_field_errors);
      toast.error(backendMessage || 'Could not remove member.');
    } finally {
      setRemoving(false);
    }
  };

  const changeRole = async (member, nextRole) => {
    if (!organizationId) {
      toast.error('No organization is selected.');
      return;
    }

    setSavingRoleId(member.id);
    try {
      await api.patch(`/organizations/${organizationId}/update_member_role/`, { member_id: member.id, role: nextRole });
      toast.success('Role updated.');
      refresh();
    } catch (error) {
      const data = error?.response?.data;
      const backendMessage = data?.detail || data?.error || data?.message || (Array.isArray(data?.non_field_errors) ? data.non_field_errors.join(' ') : data?.non_field_errors);
      toast.error(backendMessage || 'Could not change role.');
    } finally {
      setSavingRoleId(null);
    }
  };

  const clearSearch = () => setQ('');

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
      <PageHeader
        byline={`${pageRoleLabel(role)}${organization?.name ? ` - ${organization.name}` : ''}`}
        title="Team"
        lede="Manage members and invitations."
        actions={
          <>
            <Button variant="secondary" size="sm" iconLeft={<RefreshCw size={14} />} onClick={refresh} disabled={loading}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" iconRight={<Plus size={14} />} onClick={() => setInviteOpen(true)} disabled={!organizationId}>
              Invite by email
            </Button>
          </>
        }
      />

      {!organizationId && (
        <div className="mt-3 rounded-sm border border-rule bg-paper-deep px-3 py-2 text-sm text-ink-soft">
          Select an organization before managing team access.
        </div>
      )}

      {isExplicitStaff && (
        <div className="mt-3 flex items-start gap-2 rounded-sm border border-rule bg-paper-deep px-3 py-2 text-sm text-ink-soft">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-ink-muted" strokeWidth={1.5} aria-hidden="true" />
          <p>Owner-managed area. Backend permissions still apply.</p>
        </div>
      )}

      <section className="mt-4 border-t border-rule pt-3" aria-label="Team summary">
        <p className="text-sm font-medium text-ink">Summary</p>
        <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryMetric label="Members" value={summary.memberCount} />
          <SummaryMetric label="Owners" value={summary.ownerCount} />
          <SummaryMetric label="Staff" value={summary.staffCount} />
          <SummaryMetric
            label="Invites"
            value={summary.inviteCount > 0 ? summary.inviteCount : 'No pending invites'}
          />
        </div>
      </section>

      <section className="mt-3 border-y border-rule py-2.5" aria-label="Team search">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6">
            <label className="field-label" htmlFor="team-search">Search team</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" strokeWidth={1.5} aria-hidden="true" />
              <input
                id="team-search"
                type="search"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search members and invitations"
                className="w-full h-10 pl-9 pr-3 bg-paper-deep border border-rule rounded-sm text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:bg-paper focus:border-cinnabar-500 focus:ring-2 focus:ring-cinnabar-500/15 transition-colors"
              />
            </div>
          </div>
          <div className="md:col-span-6 flex items-end justify-between gap-3">
            <p className="pb-2 text-xs text-ink-muted">
              {filteredMembers.length} members - {filteredInvites.length} invites
            </p>
            {hasSearch && (
              <Button variant="ghost" size="sm" onClick={clearSearch}>Clear search</Button>
            )}
          </div>
        </div>
      </section>

      {partialError && (
        <div className="mt-3 rounded-sm border border-saffron-200 bg-saffron-50 px-3 py-2 text-sm text-saffron-700">
          Partial team data loaded. Missing: {loadErrors.join(', ')}.
        </div>
      )}

      {fullError ? (
        <ErrorState
          title="Team data is unavailable"
          description="Members and invitations could not be loaded. No team changes were made."
          action={<Button variant="secondary" onClick={refresh}>Try again</Button>}
        />
      ) : (
        <>
          <Panel className="mt-3">
            <PanelHeader>
              <PanelTitle>Members</PanelTitle>
              <p className="text-xs text-ink-muted mt-0.5">{filteredMembers.length} of {members.length} shown</p>
            </PanelHeader>
            {loading ? (
              <LoadingBlock message="Loading team members..." />
            ) : members.length === 0 ? (
              <EmptyState
                title="No members found"
                description={organizationId ? 'Invite your first teammate.' : 'Select an organization to load members.'}
                action={organizationId ? <Button variant="primary" iconRight={<Plus size={14} />} onClick={() => setInviteOpen(true)}>Send invite</Button> : null}
              />
            ) : filteredMembers.length === 0 ? (
              <EmptyState
                title="No members match this search"
                description="Clear the search to return to the full member list."
                action={<Button variant="secondary" onClick={clearSearch}>Clear search</Button>}
              />
            ) : (
              <>
                <ul className="divide-y divide-rule">
                  {pagedMembers.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      currentUser={user}
                      savingRoleId={savingRoleId}
                      onRoleChange={changeRole}
                      onRemove={() => setRemoveTarget(member)}
                    />
                  ))}
                </ul>

                <PaginationControls
                  page={membersPage}
                  setPage={setMembersPage}
                  pageSize={membersPageSize}
                  totalItems={filteredMembers.length}
                />
              </>
            )}
          </Panel>

          <Panel className="mt-4">
            <PanelHeader>
              <PanelTitle>Pending invitations</PanelTitle>
              <p className="text-xs text-ink-muted mt-0.5">{filteredInvites.length} of {invites.length} shown</p>
            </PanelHeader>
            {loading ? (
              <LoadingBlock message="Loading invitations..." />
            ) : invites.length === 0 ? (
              <EmptyState
                title="No pending invitations"
                description="Pending invites will appear here."
                action={organizationId ? <Button variant="secondary" iconRight={<Plus size={14} />} onClick={() => setInviteOpen(true)}>Invite teammate</Button> : null}
              />
            ) : filteredInvites.length === 0 ? (
              <EmptyState
                title="No invitations match this search"
                description="Clear the search to return to pending invitations."
                action={<Button variant="secondary" onClick={clearSearch}>Clear search</Button>}
              />
            ) : (
              <>
                <ul className="divide-y divide-rule">
                  {pagedInvites.map((invite) => (
                    <InviteRow key={invite.id ?? invite.email} invite={invite} />
                  ))}
                </ul>

                <PaginationControls
                  page={invitesPage}
                  setPage={setInvitesPage}
                  pageSize={invitesPageSize}
                  totalItems={filteredInvites.length}
                />
              </>
            )}
          </Panel>
        </>
      )}

      {inviteOpen && (
        <InviteEditor
          onClose={() => setInviteOpen(false)}
          onSaved={() => { setInviteOpen(false); refresh(); }}
        />
      )}

      {removeTarget && (
        <RemoveMemberDialog
          member={removeTarget}
          removing={removing}
          onClose={() => !removing && setRemoveTarget(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

function LoadingBlock({ message }) {
  return (
    <div className="py-10 flex flex-col items-center justify-center gap-3 text-sm text-ink-muted">
      <Spinner className="text-ink-muted" />
      <span>{message}</span>
    </div>
  );
}

function SummaryMetric({ label, value }) {
  return (
    <div className="rounded-md border border-rule bg-paper px-4 py-2.5">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-medium text-ink">{value}</p>
    </div>
  );
}

function MemberRow({ member, currentUser, savingRoleId, onRoleChange, onRemove }) {
  const isSelf = member.user?.id === currentUser?.id;
  const saving = savingRoleId === member.id;

  return (
    <li className="px-4 py-3.5 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={memberName(member)} size={34} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">
              {memberName(member)}
              {isSelf && <span className="ml-1 text-[11px] text-ink-muted">(you)</span>}
            </p>
            <p className="text-xs text-ink-muted truncate">{memberEmail(member)}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="w-full sm:w-36">
            <Select
              value={member.role}
              onChange={(event) => onRoleChange(member, event.target.value)}
              disabled={isSelf || saving}
            >
              {ROLES.map((roleOption) => <option key={roleOption.value} value={roleOption.value}>{roleOption.label}</option>)}
            </Select>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove} disabled={isSelf || saving} iconLeft={<X size={14} />}>
            Remove
          </Button>
        </div>
      </div>
      {saving && <p className="mt-2 text-xs text-ink-muted">Saving role change...</p>}
    </li>
  );
}

function InviteRow({ invite }) {
  return (
    <li className="px-4 py-3.5 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Mail size={16} strokeWidth={1.5} className="shrink-0 text-ink-muted" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm text-ink truncate">{invite.email ?? 'No email recorded'}</p>
            <p className="text-xs text-ink-muted">
              {invite.created_at ? `Sent ${formatDate(invite.created_at, 'relative')}` : 'Sent date unavailable'} - {roleLabel(invite.role)}
            </p>
          </div>
        </div>
        <div className="sm:shrink-0">
          <Badge tone={isPendingInvite(invite) ? 'saffron' : 'moss'}>{invite.status ?? 'PENDING'}</Badge>
        </div>
      </div>
    </li>
  );
}

function InviteEditor({ onClose, onSaved }) {
  const toast = useToast();
  const { organization } = useAuth();
  const [form, setForm] = useState({ email: '', role: 'STAFF' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState({});
  const organizationId = organization?.id;

  const submit = async (event) => {
    event.preventDefault();
    if (!organizationId) {
      setErr({ detail: 'Select or create an organization before sending an invitation.' });
      return;
    }

    setErr({});
    setSaving(true);
    try {
      await api.post(`/organizations/${organizationId}/invite/`, form);
      toast.success(`Invite sent to ${form.email}.`);
      onSaved();
    } catch (error) {
      const data = error?.response?.data;
      if (data && typeof data === 'object') {
        const nonFieldKeys = ['detail', 'error', 'non_field_errors'];
        const nextErr = {};
        Object.entries(data).forEach(([key, value]) => {
          if (nonFieldKeys.includes(key)) {
            nextErr[key] = Array.isArray(value) ? value.join(' ') : String(value);
          } else {
            nextErr[key] = Array.isArray(value) ? value[0] : String(value);
          }
        });
        setErr(nextErr);
      } else {
        toast.error('Could not send the invite.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Send an invitation"
      description="Invite a teammate to this workspace."
      size="sm"
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {(err.detail || err.error || err.non_field_errors) && (
          <div className="rounded-sm border border-cinnabar-200 bg-cinnabar-50 px-3 py-2 text-sm text-cinnabar-700">
            {err.detail || err.error || err.non_field_errors}
          </div>
        )}
        <Input
          type="email"
          label="Email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          required
          error={err.email}
          placeholder="teammate@example.com"
        />
        <Select
          label="Role"
          value={form.role}
          onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
          error={err.role}
          help="Owners manage workspace access. Staff submit and track expenses."
        >
          {ROLES.map((roleOption) => <option key={roleOption.value} value={roleOption.value}>{roleOption.label}</option>)}
        </Select>
        <div className="flex flex-col-reverse gap-2 border-t border-rule pt-3 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={saving || !organizationId}>
            {saving ? 'Sending...' : 'Send invite'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RemoveMemberDialog({ member, removing, onClose, onConfirm }) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Remove member?"
      description="This removes workspace access."
      size="sm"
    >
      <div className="space-y-4">
        <div className="rounded-sm border border-rule bg-paper-deep px-3 py-3 text-sm">
          <p className="font-medium text-ink">{memberName(member)}</p>
          <p className="mt-1 text-xs text-ink-muted">{memberEmail(member)} - {roleLabel(member.role)}</p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={removing}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={removing} iconLeft={<Trash2 size={14} />}>
            {removing ? 'Removing...' : 'Remove member'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
