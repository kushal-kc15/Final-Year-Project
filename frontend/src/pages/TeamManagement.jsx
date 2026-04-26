import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

const ROLE_CONFIG = {
  OWNER:   { label: 'Owner',   bg: 'bg-brand-50',   text: 'text-brand-700',   border: 'border-brand-200',   dot: 'bg-brand-500',   icon: 'admin_panel_settings' },
  MANAGER: { label: 'Manager', bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: 'manage_accounts'      },
  STAFF:   { label: 'Staff',   bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400',   icon: 'badge'                },
};

// Avatar color based on first letter
const AVATAR_COLORS = [
  '#3B5BDB', '#10b981', '#f97316', '#8b5cf6',
  '#06b6d4', '#ec4899', '#f59e0b', '#ef4444',
];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

function MemberCard({ member, currentUserRole, onRoleChange, onRemove }) {
  const rc      = ROLE_CONFIG[member.role] || ROLE_CONFIG.STAFF;
  const canEdit = currentUserRole === 'OWNER' && member.role !== 'OWNER';
  const color   = avatarColor(member.user.username);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all p-5">
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-display font-700 text-lg shrink-0"
            style={{ background: color }}
          >
            {member.user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-display font-700 text-slate-900 leading-tight">{member.user.username}</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[140px]">{member.user.email}</p>
          </div>
        </div>

        {/* Remove button */}
        {canEdit && (
          <button
            onClick={() => onRemove(member.id)}
            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <span className="material-icons text-sm">close</span>
          </button>
        )}
      </div>

      {/* Role badge / selector */}
      <div className="mb-4">
        {canEdit ? (
          <div className="relative">
            <select
              value={member.role}
              onChange={e => onRoleChange(member.id, e.target.value)}
              className={`w-full text-xs font-bold px-3 py-2 rounded-xl border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-700/20 pr-8 ${rc.bg} ${rc.text} ${rc.border}`}
            >
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
              <option value="OWNER">Owner</option>
            </select>
            <span className="material-icons text-[14px] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'currentColor' }}>
              expand_more
            </span>
          </div>
        ) : (
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${rc.bg} ${rc.text} ${rc.border}`}>
            <span className="material-icons text-[14px]">{rc.icon}</span>
            {rc.label}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
        <span className="material-icons text-slate-300 text-sm">calendar_today</span>
        <span className="text-xs text-slate-400">
          Joined {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
    </div>
  );
}

function TeamManagement() {
  const navigate = useNavigate();
  const { role: currentUserRole, loading: authLoading } = useAuth();

  const [members,      setMembers]      = useState([]);
  const [organization, setOrganization] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [confirmState, setConfirmState] = useState({ open: false, type: null, memberId: null, newRole: null, message: '' });
  const [toast,        setToast]        = useState(null);
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState('ALL');
  
  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('STAFF');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => { if (!authLoading) fetchData(); }, [authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const orgsRes = await api.get('/organizations/');
      const orgs    = orgsRes.data.results || orgsRes.data;
      if (orgs.length > 0) {
        const org = orgs[0];
        setOrganization(org);
        const membersRes = await api.get(`/organizations/${org.id}/members/`);
        setMembers(membersRes.data);
      }
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    } finally { setLoading(false); }
  };

  const showToast = (msg, type = 'error') => setToast({ message: msg, type });

  const handleRoleChange = (memberId, newRole) => {
    if (currentUserRole !== 'OWNER') { showToast('Only owners can change roles.'); return; }
    setConfirmState({ open: true, type: 'role', memberId, newRole, message: `Change this member's role to ${newRole}?` });
  };

  const handleRemove = (memberId) => {
    if (currentUserRole !== 'OWNER') { showToast('Only owners can remove members.'); return; }
    setConfirmState({ open: true, type: 'remove', memberId, newRole: null, message: 'Remove this member from the organisation?' });
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setInviting(true);
    try {
      const response = await api.post(`/organizations/${organization.id}/invite/`, {
        email: inviteEmail,
        role: inviteRole
      });
      
      // Generate invitation link
      const token = response.data.token;
      const link = `${window.location.origin}/invite?token=${token}`;
      setInviteLink(link);
      
      // Check if email was sent
      const emailSent = response.data.email_sent;
      if (emailSent) {
        showToast('Invitation sent via email! You can also share the link below.', 'success');
      } else {
        showToast('Invitation created! Share the link below (email sending is disabled in development).', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    showToast('Link copied to clipboard!', 'success');
  };

  const closeInviteModal = () => {
    setInviteModalOpen(false);
    setInviteEmail('');
    setInviteRole('STAFF');
    setInviteLink('');
  };

  const handleConfirm = async () => {
    const { type, memberId, newRole } = confirmState;
    setConfirmState({ open: false, type: null, memberId: null, newRole: null, message: '' });
    try {
      if (type === 'role') {
        await api.patch(`/organizations/${organization.id}/update_member_role/`, { member_id: memberId, role: newRole });
        showToast('Role updated.', 'success');
      } else {
        await api.delete(`/organizations/${organization.id}/remove_member/`, { data: { member_id: memberId } });
        showToast('Member removed.', 'info');
      }
      await fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Action failed.'); }
  };

  // Filtered members
  const filtered = members.filter(m => {
    const matchSearch = m.user.username.toLowerCase().includes(search.toLowerCase()) ||
                        m.user.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'ALL' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Counts
  const ownerCount   = members.filter(m => m.role === 'OWNER').length;
  const managerCount = members.filter(m => m.role === 'MANAGER').length;
  const staffCount   = members.filter(m => m.role === 'STAFF').length;

  return (
    <div className="flex min-h-screen bg-slate-50 font-body">
      <Sidebar currentPage="team" />

      <div className="ml-64 flex-1 flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 h-16 flex items-center justify-between shrink-0">
          <h1 className="font-display text-lg font-700 text-slate-900">Team</h1>
          <div className="flex items-center gap-3">
            {!loading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="material-icons text-[18px] text-slate-400">group</span>
                {members.length} member{members.length !== 1 ? 's' : ''}
              </div>
            )}
            {(currentUserRole === 'OWNER' || currentUserRole === 'MANAGER') && (
              <button
                onClick={() => setInviteModalOpen(true)}
                className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                <span className="material-icons text-[18px]">person_add</span>
                Invite Member
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 p-8 space-y-7 overflow-y-auto">

          <div>
            <h2 className="font-display text-2xl font-700 text-slate-900">Team Management</h2>
            <p className="text-sm text-slate-500 mt-0.5">Manage your team members and their access levels.</p>
          </div>

          {/* Role breakdown + search row */}
          <div className="flex items-center justify-between gap-6 flex-wrap">

            {/* Role filter pills */}
            <div className="flex items-center gap-2">
              {[
                { key: 'ALL',     label: `All (${members.length})` },
                { key: 'OWNER',   label: `Owners (${ownerCount})`   },
                { key: 'MANAGER', label: `Managers (${managerCount})` },
                { key: 'STAFF',   label: `Staff (${staffCount})`    },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setRoleFilter(f.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    roleFilter === f.key
                      ? 'bg-brand-700 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search members…"
                className="pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl w-56 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all"
              />
            </div>
          </div>

          {/* Member grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="w-28 h-3.5 bg-slate-100 rounded" />
                      <div className="w-36 h-2.5 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="w-20 h-7 bg-slate-100 rounded-xl" />
                  <div className="w-32 h-2.5 bg-slate-100 rounded pt-3 border-t border-slate-100" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-14 text-center shadow-card">
              <span className="material-icons text-5xl text-slate-200 mb-3 block">person_search</span>
              <p className="font-display font-700 text-slate-900 mb-1">No members found</p>
              <p className="text-sm text-slate-500">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(member => (
                <MemberCard
                  key={member.id}
                  member={member}
                  currentUserRole={currentUserRole}
                  onRoleChange={handleRoleChange}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}

          {/* Role permissions info */}
          <div className="grid grid-cols-3 gap-5">
            {[
              { role: 'OWNER',   perms: ['Full access to all features', 'Manage billing & team', 'Change member roles', 'Delete organisation'] },
              { role: 'MANAGER', perms: ['Approve & reject expenses', 'View all reports', 'Manage budgets & vendors', 'View team members'] },
              { role: 'STAFF',   perms: ['Submit expenses', 'View own expense status', 'View own dashboard'] },
            ].map(r => {
              const rc = ROLE_CONFIG[r.role];
              return (
                <div key={r.role} className={`rounded-2xl border p-5 ${rc.bg} ${rc.border}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`material-icons text-[18px] ${rc.text}`}>{rc.icon}</span>
                    <p className={`font-display font-700 text-sm ${rc.text}`}>{rc.label}</p>
                  </div>
                  <ul className="space-y-1.5">
                    {r.perms.map(p => (
                      <li key={p} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <span className={`material-icons text-[13px] mt-0.5 ${rc.text}`}>check</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmState.type === 'remove' ? 'Remove Member' : 'Change Role'}
        message={confirmState.message}
        confirmLabel={confirmState.type === 'remove' ? 'Remove' : 'Change'}
        variant={confirmState.type === 'remove' ? 'danger' : 'primary'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState({ open: false, type: null, memberId: null, newRole: null, message: '' })}
      />

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-7">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl font-700 text-slate-900">Invite Team Member</h3>
              <button
                onClick={closeInviteModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {!inviteLink ? (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all text-slate-900"
                  >
                    <option value="STAFF">Staff</option>
                    <option value="MANAGER">Manager</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeInviteModal}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 py-2.5 bg-brand-700 text-white font-semibold rounded-xl hover:bg-brand-800 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {inviting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <span className="material-icons text-sm">send</span>
                        Create Invitation
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                  <span className="material-icons text-emerald-600 text-xl">check_circle</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Invitation Created!</p>
                    <p className="text-xs text-emerald-700 mt-0.5">Share this link with {inviteEmail}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Invitation Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono text-xs"
                    />
                    <button
                      onClick={copyInviteLink}
                      className="px-4 py-2.5 bg-brand-700 text-white font-semibold rounded-xl hover:bg-brand-800 transition-colors text-sm flex items-center gap-2"
                    >
                      <span className="material-icons text-sm">content_copy</span>
                      Copy
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  The recipient must register or login with <span className="font-semibold">{inviteEmail}</span> to accept this invitation.
                </p>

                <button
                  onClick={closeInviteModal}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-sm"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default TeamManagement;