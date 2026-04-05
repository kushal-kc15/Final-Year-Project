import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AddExpenseModal from '../components/AddExpenseModal';
import Sidebar from '../components/Sidebar';
import { formatCurrency } from '../utils/currency';

const STATUS_STYLE = { APPROVED: 'bg-emerald-50 text-emerald-700', PENDING: 'bg-amber-50 text-amber-700', REJECTED: 'bg-red-50 text-red-600' };
const CAT_COLOR = { FOOD: '#f97316', TRANSPORT: '#3b82f6', OFFICE: '#8b5cf6', UTILITIES: '#06b6d4', SALARY: '#10b981', RENT: '#ec4899', MARKETING: '#f59e0b', OTHER: '#94a3b8' };
const CAT_LABEL = { FOOD: 'Food & Dining', TRANSPORT: 'Transport', OFFICE: 'Office', UTILITIES: 'Utilities', SALARY: 'Salary', RENT: 'Rent', MARKETING: 'Marketing', OTHER: 'Other' };

function MetricCard({ period, label, value, count, growth, icon, iconBg, iconColor }) {
  const up = growth > 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <span className={`material-icons text-[20px] ${iconColor}`}>{icon}</span>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{period}</span>
      </div>
      <p className="text-sm text-slate-500 font-medium mb-1">{label}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-display text-2xl font-700 text-slate-900">{value}</span>
        {!!growth && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${up ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
            <span className="material-icons text-xs">{up ? 'arrow_upward' : 'arrow_downward'}</span>
            {Math.abs(growth)}%
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-1.5">{count} transaction{count !== 1 ? 's' : ''}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100" />
        <div className="w-16 h-3 rounded bg-slate-100" />
      </div>
      <div className="w-24 h-3 rounded bg-slate-100 mb-3" />
      <div className="w-32 h-7 rounded bg-slate-100 mb-2" />
      <div className="w-20 h-3 rounded bg-slate-100" />
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { user, role: userRole, loading: authLoading, currency } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [myExpenses, setMyExpenses] = useState(null);
  const [recentExp, setRecentExp] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fmt = (amount) => formatCurrency(amount, currency);

  const fetchMetrics = useCallback(async () => { const res = await api.get('/expenses/dashboard_metrics/'); setMetrics(res.data); }, []);
  const fetchStaffMetrics = useCallback(async () => {
    const [mRes, eRes] = await Promise.all([api.get('/expenses/dashboard_metrics/'), api.get('/expenses/my_expenses/')]);
    setMetrics(mRes.data); setMyExpenses(eRes.data);
  }, []);
  const fetchRecent = useCallback(async () => {
    try { const res = await api.get('/expenses/', { params: { page: 1 } }); const list = res.data.results || res.data; setRecentExp(Array.isArray(list) ? list.slice(0, 6) : []); }
    catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    const load = async () => {
      try { await Promise.all([userRole === 'STAFF' ? fetchStaffMetrics() : fetchMetrics(), fetchRecent()]); }
      finally { setLoading(false); }
    };
    load();
  }, [user, userRole, authLoading, navigate, fetchMetrics, fetchStaffMetrics, fetchRecent]);

  const onSuccess = () => { fetchRecent(); userRole === 'STAFF' ? fetchStaffMetrics() : fetchMetrics(); };

  return (
    <div className="flex min-h-screen bg-slate-50 font-body">
      <Sidebar currentPage="dashboard" onAddNew={() => setIsModalOpen(true)} />
      <div className="ml-64 flex-1 flex flex-col">

        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 h-16 flex items-center justify-between shrink-0">
          <h1 className="font-display text-lg font-700 text-slate-900">Dashboard</h1>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <span className="material-icons text-[20px]">notifications_none</span>
            </button>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.username}</p>
                <p className="text-[11px] text-slate-400 leading-tight">{user?.business_name || 'Business'}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 space-y-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-700 text-slate-900">Good to see you, {user?.username} 👋</h2>
              <p className="text-sm text-slate-500 mt-0.5">Here's what's happening with your finances.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="hidden md:flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
              <span className="material-icons text-[18px]">add</span> New Expense
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {loading ? (<><SkeletonCard /><SkeletonCard /><SkeletonCard /></>) : (
              <>
                <MetricCard period="Today" label="Total Spent" value={fmt(metrics?.today?.total)} count={metrics?.today?.count || 0} growth={metrics?.today?.growth} icon="receipt_long" iconBg="bg-brand-50" iconColor="text-brand-700" />
                <MetricCard period="This Week" label="Weekly Total" value={fmt(metrics?.week?.total)} count={metrics?.week?.count || 0} growth={metrics?.week?.growth} icon="calendar_today" iconBg="bg-violet-50" iconColor="text-violet-600" />
                <MetricCard period="This Month" label="Monthly Total" value={fmt(metrics?.month?.total)} count={metrics?.month?.count || 0} growth={metrics?.month?.growth} icon="account_balance" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
              </>
            )}
          </div>

          {!loading && userRole === 'STAFF' && myExpenses && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
                  <span className="material-icons text-brand-700 text-[18px]">assignment</span>
                </div>
                <div>
                  <h3 className="font-display font-700 text-slate-900">My Expense Status</h3>
                  <p className="text-xs text-slate-500">Your submitted expenses at a glance</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Pending', data: myExpenses.pending, border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', icon: 'schedule' },
                  { label: 'Approved', data: myExpenses.approved, border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'check_circle' },
                  { label: 'Rejected', data: myExpenses.rejected, border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-600', icon: 'cancel' },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl border p-4 ${s.border} ${s.bg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{s.label}</span>
                      <span className={`material-icons text-sm ${s.text}`}>{s.icon}</span>
                    </div>
                    <p className={`font-display text-2xl font-700 ${s.text}`}>{s.data.count}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.label !== 'Rejected' ? fmt(s.data.total) : 'Needs resubmission'}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-2 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
                <span className="material-icons text-brand-600 text-sm mt-0.5">info</span>
                <p className="text-xs text-brand-800">Pending expenses are reviewed within 24–48 hours.</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="font-display font-700 text-slate-900">Recent Expenses</h3>
                <p className="text-xs text-slate-500 mt-0.5">Your latest 6 transactions</p>
              </div>
              <Link to="/expenses" className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1 transition-colors">
                View all <span className="material-icons text-sm">arrow_forward</span>
              </Link>
            </div>
            {loading ? (
              <div className="divide-y divide-slate-50">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-2"><div className="w-40 h-3 bg-slate-100 rounded" /><div className="w-24 h-2.5 bg-slate-100 rounded" /></div>
                    <div className="w-20 h-3 bg-slate-100 rounded" />
                    <div className="w-16 h-6 bg-slate-100 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentExp.length === 0 ? (
              <div className="py-14 flex flex-col items-center gap-3">
                <span className="material-icons text-5xl text-slate-200">receipt_long</span>
                <p className="text-sm text-slate-400 font-medium">No expenses recorded yet</p>
                <button onClick={() => setIsModalOpen(true)} className="text-xs font-semibold text-brand-700 hover:underline">Add your first expense →</button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentExp.map(exp => (
                  <div key={exp.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${CAT_COLOR[exp.category] || CAT_COLOR.OTHER}18` }}>
                      <span className="material-icons text-[18px]" style={{ color: CAT_COLOR[exp.category] || CAT_COLOR.OTHER }}>receipt</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{exp.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-400">{CAT_LABEL[exp.category] || exp.category}</span>
                        {exp.user_details && (<><span className="text-slate-300">·</span><span className="text-[11px] text-slate-400">{exp.user_details.username}</span></>)}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 hidden sm:block shrink-0">{new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    <p className="text-sm font-bold text-slate-900 w-28 text-right shrink-0">{fmt(exp.amount)}</p>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[exp.status] || STATUS_STYLE.PENDING}`}>{exp.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={onSuccess} />
    </div>
  );
}

export default Dashboard;