import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function TeamManagement() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get user's organizations
      const orgsResponse = await api.get('/organizations/');
      const organizations = orgsResponse.data.results || orgsResponse.data;
      if (organizations.length > 0) {
        const org = organizations[0];
        setOrganization(org);
        
        // Get members
        const membersResponse = await api.get(`/organizations/${org.id}/members/`);
        setMembers(membersResponse.data);
        
        // Find current user's role
        const currentUser = await api.get('/auth/me/');
        const userMember = membersResponse.data.find(m => m.user.id === currentUser.data.id);
        setCurrentUserRole(userMember?.role);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    if (currentUserRole !== 'OWNER') {
      alert('Only owners can change member roles');
      return;
    }

    if (!confirm(`Are you sure you want to change this member's role to ${newRole}?`)) {
      return;
    }

    try {
      await api.patch(`/organizations/${organization.id}/update_member_role/`, {
        member_id: memberId,
        role: newRole
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating role:', error);
      alert(error.response?.data?.error || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (currentUserRole !== 'OWNER') {
      alert('Only owners can remove members');
      return;
    }

    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      await api.delete(`/organizations/${organization.id}/remove_member/`, {
        data: { member_id: memberId }
      });
      
      fetchData();
    } catch (error) {
      console.error('Error removing member:', error);
      alert(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      OWNER: 'bg-[#00236f] text-white',
      MANAGER: 'bg-blue-100 text-blue-700',
      STAFF: 'bg-gray-100 text-gray-700'
    };
    return colors[role] || colors.STAFF;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-100 border-r border-gray-200 flex flex-col py-6 z-40">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00236f] rounded-lg flex items-center justify-center text-white">
            <span className="material-icons text-xl">account_balance_wallet</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-blue-900 leading-tight">Vyapar</h2>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">SME Management</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3">
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-3 text-slate-600 hover:text-blue-800 hover:bg-slate-200 transition-all">
            <span className="material-icons">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link to="/expenses" className="flex items-center gap-3 px-3 py-3 text-slate-600 hover:text-blue-800 hover:bg-slate-200 transition-all">
            <span className="material-icons">payments</span>
            <span>Expenses</span>
          </Link>
          <a className="flex items-center gap-3 px-3 py-3 text-slate-600 hover:text-blue-800 hover:bg-slate-200 transition-all" href="#">
            <span className="material-icons">assessment</span>
            <span>Reports</span>
          </a>
          <Link 
            to="/team"
            className="relative flex items-center gap-3 px-3 py-3 border-l-4 border-blue-900 text-blue-900 bg-blue-50/50 font-semibold transition-all"
          >
            <span className="material-icons">group</span>
            <span>Team</span>
          </Link>
        </nav>

        <div className="px-3 mt-auto flex flex-col gap-1">
          <button className="mb-6 mx-3 py-3 px-4 bg-[#00236f] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <span className="material-icons">group_add</span>
            Invite Team
          </button>
          <a className="flex items-center gap-3 px-3 py-3 text-slate-600 hover:text-blue-800 hover:bg-slate-200 transition-all" href="#">
            <span className="material-icons">help</span>
            <span>Help Center</span>
          </a>
          <button 
            onClick={() => {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              navigate('/login');
            }}
            className="flex items-center gap-3 px-3 py-3 text-slate-600 hover:text-blue-800 hover:bg-slate-200 transition-all"
          >
            <span className="material-icons">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <span className="text-sm font-bold uppercase tracking-widest text-[#00236f] mb-2 block">Settings</span>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Team Management</h1>
            <p className="text-gray-600 mt-2 text-lg">Manage team members and their access levels</p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-[#00236f]">
                  <span className="material-icons">admin_panel_settings</span>
                </div>
                <h3 className="font-bold text-xl">Owner</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Full access to all features including billing and team management.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <span className="material-icons">manage_accounts</span>
                </div>
                <h3 className="font-bold text-xl">Manager</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Can approve expenses and view reports. Limited settings access.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                  <span className="material-icons">badge</span>
                </div>
                <h3 className="font-bold text-xl">Staff</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Can add expenses. Requires approval for all transactions.
              </p>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="p-6 flex justify-between items-center border-b border-gray-100">
              <h2 className="text-xl font-bold">Team Members</h2>
              <span className="text-sm text-gray-600">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-600">User</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-600">Role</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-600">Joined</th>
                    {currentUserRole === 'OWNER' && (
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-600 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#00236f] font-bold">
                            {member.user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{member.user.username}</div>
                            <div className="text-xs text-gray-500">{member.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {currentUserRole === 'OWNER' && member.role !== 'OWNER' ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold border-none outline-none cursor-pointer ${getRoleBadgeColor(member.role)}`}
                          >
                            <option value="OWNER">OWNER</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="STAFF">STAFF</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${getRoleBadgeColor(member.role)}`}>
                            {member.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600">
                        {new Date(member.joined_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </td>
                      {currentUserRole === 'OWNER' && (
                        <td className="px-6 py-5 text-right">
                          {member.role !== 'OWNER' && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <span className="material-icons text-sm">delete</span>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <span className="material-icons">info</span>
            </div>
            <div>
              <h4 className="font-bold text-lg text-blue-900">Role Permissions</h4>
              <p className="text-gray-700 mt-1 leading-relaxed">
                Only <strong>Owners</strong> can change member roles or remove team members. 
                At least one Owner must remain in the organization at all times.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeamManagement;
