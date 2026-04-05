import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const FILTERS = [
  { key: 'all',              label: 'All Activity' },
  { key: 'EXPENSE_CREATED',  label: 'Expenses' },
  { key: 'EXPENSE_APPROVED', label: 'Approvals' },
  { key: 'BUDGET_CREATED',   label: 'Budgets' },
];

export default function ActivityCenter() {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  
  const [activities,  setActivities]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypes, setActionTypes] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.action_type = filter;
      if (searchQuery) params.search = searchQuery; // Assuming API supports search
      
      const response = await api.get('/activity-logs/', { params });
      const data = response.data.results || response.data;
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  const fetchActionTypes = async () => {
    try {
      const response = await api.get('/activity-logs/action_types/');
      setActionTypes(response.data);
    } catch (error) {
      console.error('Error fetching action types:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchActivities();
      fetchActionTypes();
    }
  }, [user, fetchActivities]);

  const getActionStyle = (actionType) => {
    const type = actionType.toUpperCase();
    if (type.includes('APPROVED')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'check_circle' };
    if (type.includes('REJECTED')) return { bg: 'bg-red-50',  text: 'text-red-600',  icon: 'cancel' };
    if (type.includes('BUDGET'))   return { bg: 'bg-violet-50',  text: 'text-violet-600',  icon: 'account_balance_wallet' };
    if (type.includes('MEMBER') || type.includes('ROLE')) return { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'group' };
    if (type.includes('LOGIN') || type.includes('LOGOUT')) return { bg: 'bg-slate-100', text: 'text-slate-600', icon: 'login' };
    if (type.includes('DELETED'))  return { bg: 'bg-slate-100',  text: 'text-slate-600',  icon: 'delete' };
    
    // Default (CREATED, EXPENSE)
    return { bg: 'bg-brand-50', text: 'text-brand-700', icon: 'receipt_long' };
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const todayCount = activities.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length;

  return (
    <div className="flex min-h-screen bg-slate-50 font-body">
      <Sidebar currentPage="activity" />
      
      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 h-16 flex items-center justify-between shrink-0">
          <h1 className="font-display text-lg font-700 text-slate-900">Activity Center</h1>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
          </div>
        </header>

        {/* Split body */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* ── Left panel ──────────────────────────────────────────────── */}
          <aside className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-y-auto">
            
            {/* Summary */}
            <div className="p-6 border-b border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Overview</p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Total Activities</p>
                  <p className="font-display text-2xl font-700 text-slate-900">{loading ? '—' : activities.length}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">Today</p>
                    <p className="font-display text-xl font-700 text-emerald-700">{loading ? '—' : todayCount}</p>
                  </div>
                  <div className="bg-violet-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 mb-1">Types</p>
                    <p className="font-display text-xl font-700 text-violet-700">{actionTypes.length || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Search</p>
              <div className="relative">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search events..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Filter Events</p>
              <div className="space-y-1">
                {FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === f.key
                        ? 'bg-brand-700 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{f.label}</span>
                    {filter === f.key && <span className="material-icons text-sm">check</span>}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Right panel — Activity Feed ─────────────────────────────── */}
          <main className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="w-48 h-3.5 bg-slate-100 rounded" />
                      <div className="w-28 h-2.5 bg-slate-100 rounded" />
                    </div>
                    <div className="w-16 h-3 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-24">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <span className="material-icons text-3xl text-slate-300">notifications_off</span>
                </div>
                <div className="text-center">
                  <p className="font-display font-700 text-slate-900 mb-1">No activities found</p>
                  <p className="text-sm text-slate-500">Events and notifications will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="p-8 space-y-3 max-w-4xl">
                {activities.map((activity) => {
                  const style = getActionStyle(activity.action_type);
                  
                  return (
                    <div
                      key={activity.id}
                      className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-card transition-all flex items-start sm:items-center gap-4 p-4 group"
                    >
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
                        <span className={`material-icons text-[18px] ${style.text}`}>
                          {style.icon}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5 sm:pt-0">
                        <p className="text-sm font-semibold text-slate-800 leading-snug">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {activity.action_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-slate-200">·</span>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <span className="material-icons text-[12px] text-slate-400">person</span>
                            {activity.user_name || activity.user_email}
                          </div>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="shrink-0 flex items-center text-xs font-medium text-slate-400">
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}