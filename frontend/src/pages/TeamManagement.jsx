import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import ProfileDropdown from '../components/ProfileDropdown';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

const ROLE_CONFIG = {
  OWNER:   { label: 'Owner',   bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500',    icon: 'admin_panel_settings' },
  STAFF:   { label: 'Staff',   bg: 'bg-gray-100',    text: 'text-gray-600',    border: 'border-gray-200',    dot: 'bg-gray-400',    icon: 'badge'                },
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
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-all p-5">
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg shrink-0"
            style={{ background: color }}
          >
            {member.user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 leading-tight">{member.user.username}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[140px]">{member.user.email}</p>
          </div>
        </div>

        {/* Remove button */}
        {canEdit && (
          <button
            onClick={() => onRemove(member.id)}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
              className={`w-full text-xs font-bold px-3 py-2 rounded-xl border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 pr-8 ${rc.bg} ${rc.text} ${rc.border}`}
            >
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
      <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
        <span className="material-icons text-gray-300 text-sm">calendar_today</span>
        <span className="text-xs text-gray-400">
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
  const [confirmState, setConfirmState] = useState({ open: false, type: null, memberId: null, newRole: null, message: '', inviteId: null, inviteEmail: '' });
  const [toast,        setToast]        = useState(null);
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState('ALL');
  
  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('STAFF');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [pendingInvites, setPendingInvites] = useState([]);

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
        
        // Fetch pending invitations
        if (currentUserRole === 'OWNER') {
          try {
            const invitesRes = await api.get('/invitations/');
            const allInvites = invitesRes.data.results || invitesRes.data;
            setPendingInvites(allInvites.filter(inv => inv.status === 'PENDING' && inv.organization === org.id));
          } catch (err) {
            console.error('Failed to fetch invitations:', err);
          }
        }
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
    setConfirmState({ open: true, type: 'remove', memberId, newRole: null, message: 'Remove this member from the organisation?', inviteId: null, inviteEmail: '' });
  };

  const handleCancelInvite = (inviteId, inviteEmail) => {
    setConfirmState({ 
      open: true, 
      type: 'cancelInvite', 
      memberId: null, 
      newRole: null, 
      message: `Cancel invitation for ${inviteEmail}?`, 
      inviteId, 
      inviteEmail 
    });
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
    const { type, memberId, newRole, inviteId } = confirmState;
    setConfirmState({ open: false, type: null, memberId: null, newRole: null, message: '', inviteId: null, inviteEmail: '' });
    try {
      if (type === 'role') {
        await api.patch(`/organizations/${organization.id}/update_member_role/`, { member_id: memberId, role: newRole });
        showToast('Role updated.', 'success');
      } else if (type === 'remove') {
        await api.delete(`/organizations/${organization.id}/remove_member/`, { data: { member_id: memberId } });
        showToast('Member removed.', 'info');
      } else if (type === 'cancelInvite') {
        await api.delete(`/invitations/${inviteId}/cancel/`);
        showToast('Invitation cancelled', 'info');
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
  const staffCount   = members.filter(m => m.role === 'STAFF').length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage="team" />

      <div className="ml-64 flex-1 flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 h-20 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Team Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your team members and their access levels</p>
          </div>
          <div className="flex items-center gap-3">
            {!loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="material-icons text-[18px] text-gray-400">group</span>
                {members.length} member{members.length !== 1 ? 's' : ''}
              </div>
            )}
            {(currentUserRole === 'OWNER') && (
              <button
                onClick={() => setInviteModalOpen(true)}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                <span className="material-icons text-[18px]">person_add</span>
                Invite Member
              </button>
            )}
            <NotificationBell />
            <div className="w-px h-8 bg-gray-200" />
            <ProfileDropdown />
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-6">
              
              {/* Main Content - Left Side */}
              <div className="flex-1 space-y-7">

                {/* Info Banner - Understanding Roles */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      <span className="material-icons text-white text-lg">info</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2">Team Roles & Permissions</h3>
                      <div className="grid md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
                          <p className="font-semibold text-blue-900 mb-1 flex items-center gap-1.5">
                            <span className="material-icons text-sm">admin_panel_settings</span>
                            Owner
                          </p>
                          <p className="text-gray-600">Full control: manage team, budgets, approve expenses, view all reports</p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
                          <p className="font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                            <span className="material-icons text-sm">badge</span>
                            Staff
                          </p>
                          <p className="text-gray-600">Submit expenses, upload receipts, view own expense status</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role breakdown + search row */}
                <div className="flex items-center justify-between gap-6 flex-wrap">

                  {/* Role filter pills */}
                  <div className="flex items-center gap-2">
                    {[
                      { key: 'ALL',     label: `All (${members.length})` },
                      { key: 'OWNER',   label: `Owners (${ownerCount})`   },
                      { key: 'STAFF',   label: `Staff (${staffCount})`    },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setRoleFilter(f.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          roleFilter === f.key
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search members…"
                      className="pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Member grid */}
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-white rounded-xl border-2 border-gray-200 p-5 animate-pulse space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
                          <div className="space-y-2 flex-1">
                            <div className="w-28 h-3.5 bg-gray-100 rounded" />
                            <div className="w-36 h-2.5 bg-gray-100 rounded" />
                          </div>
                        </div>
                        <div className="w-20 h-7 bg-gray-100 rounded-xl" />
                        <div className="w-32 h-2.5 bg-gray-100 rounded pt-3 border-t border-gray-100" />
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-14 text-center shadow-md">
                    <span className="material-icons text-5xl text-gray-200 mb-3 block">person_search</span>
                    <p className="font-semibold text-gray-900 mb-1">No members found</p>
                    <p className="text-sm text-gray-500">Try adjusting your search or filter.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

              </div>

              {/* Sidebar - Right Side - Pending Invitations */}
              {!loading && (currentUserRole === 'OWNER') && (
                <div className="w-80 shrink-0 space-y-4 sticky top-8 self-start">
                  
                  {/* Pending Invitations Card */}
                  <div className="bg-white rounded-xl border-2 border-gray-200 shadow-md overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 border-b-2 border-amber-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          <span className="material-icons text-amber-600">mail</span>
                          Pending Invites
                        </h3>
                        {pendingInvites.length > 0 && (
                          <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {pendingInvites.length}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                      {pendingInvites.length === 0 ? (
                        <div className="p-8 text-center">
                          <span className="material-icons text-4xl text-gray-200 mb-2 block">mail_outline</span>
                          <p className="text-sm text-gray-500">No pending invitations</p>
                        </div>
                      ) : (
                        <div className="p-4 space-y-3">
                          {pendingInvites.map(invite => {
                            const rc = ROLE_CONFIG[invite.role] || ROLE_CONFIG.STAFF;
                            const inviteUrl = `${window.location.origin}/invite?token=${invite.token}`;
                            return (
                              <div key={invite.id} className="bg-gray-50 rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-2 mb-2">
                                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                                    <span className="material-icons text-amber-600 text-sm">person_add</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">{invite.email}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${rc.bg} ${rc.text}`}>
                                        {rc.label}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {new Date(invite.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Action buttons */}
                                <div className="flex gap-1 mt-2">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(inviteUrl);
                                      showToast('Link copied!', 'success');
                                    }}
                                    className="flex-1 px-2 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                                    title="Copy invitation link"
                                  >
                                    <span className="material-icons text-sm">content_copy</span>
                                    Copy
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        await api.post(`/invitations/${invite.id}/resend/`);
                                        showToast('Invitation resent!', 'success');
                                      } catch (err) {
                                        showToast(err.response?.data?.error || 'Failed to resend');
                                      }
                                    }}
                                    className="flex-1 px-2 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                                    title="Resend invitation email"
                                  >
                                    <span className="material-icons text-sm">send</span>
                                    Resend
                                  </button>
                                  <button
                                    onClick={() => handleCancelInvite(invite.id, invite.email)}
                                    className="px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Cancel invitation"
                                  >
                                    <span className="material-icons text-sm">close</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmState.open}
        title={
          confirmState.type === 'remove' ? 'Remove Member' : 
          confirmState.type === 'cancelInvite' ? 'Cancel Invitation' : 
          'Change Role'
        }
        message={confirmState.message}
        confirmLabel={
          confirmState.type === 'remove' ? 'Remove' : 
          confirmState.type === 'cancelInvite' ? 'Cancel Invitation' : 
          'Change'
        }
        variant={confirmState.type === 'remove' || confirmState.type === 'cancelInvite' ? 'danger' : 'primary'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState({ open: false, type: null, memberId: null, newRole: null, message: '', inviteId: null, inviteEmail: '' })}
      />

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-7">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Invite Team Member</h3>
              <button
                onClick={closeInviteModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {!inviteLink ? (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                  >
                    <option value="STAFF">👤 Staff - Submit expenses</option>
                    <option value="OWNER">👑 Owner - Full control</option>
                  </select>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      {inviteRole === 'OWNER' && '👑 Owner Permissions:'}
                      {inviteRole === 'STAFF' && '👤 Staff Permissions:'}
                    </p>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      {inviteRole === 'OWNER' && (
                        <>
                          <li>• Full access to all features</li>
                          <li>• Manage team members & roles</li>
                          <li>• Approve/reject expenses</li>
                          <li>• Manage budgets & vendors</li>
                        </>
                      )}
                      {inviteRole === 'STAFF' && (
                        <>
                          <li>• Submit expenses</li>
                          <li>• Upload receipts</li>
                          <li>• View own expense status</li>
                          <li>• View own dashboard</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeInviteModal}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Invitation Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-mono text-xs"
                    />
                    <button
                      onClick={copyInviteLink}
                      className="px-4 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-sm flex items-center gap-2"
                    >
                      <span className="material-icons text-sm">content_copy</span>
                      Copy
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  The recipient must register or login with <span className="font-semibold">{inviteEmail}</span> to accept this invitation.
                </p>

                <button
                  onClick={closeInviteModal}
                  className="w-full py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
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