import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AddExpenseModal from '../components/AddExpenseModal';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import ProfileDropdown from '../components/ProfileDropdown';
import OnboardingChecklist from '../components/OnboardingChecklist';
import { formatCurrency } from '../utils/currency';

const STATUS_STYLE = { APPROVED: 'bg-emerald-50 text-emerald-700', PENDING: 'bg-amber-50 text-amber-700', REJECTED: 'bg-red-50 text-red-600' };
const CAT_COLOR = { FOOD: '#f97316', TRANSPORT: '#3b82f6', OFFICE: '#8b5cf6', UTILITIES: '#06b6d4', SALARY: '#10b981', RENT: '#ec4899', MARKETING: '#f59e0b', OTHER: '#94a3b8' };
const CAT_LABEL = { FOOD: 'Food & Dining', TRANSPORT: 'Transport', OFFICE: 'Office', UTILITIES: 'Utilities', SALARY: 'Salary', RENT: 'Rent', MARKETING: 'Marketing', OTHER: 'Other' };

function Dashboard() {
  const navigate = useNavigate();
  const { user, role: userRole, loading: authLoading, currency } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [myExpenses, setMyExpenses] = useState(null);
  const [recentExp, setRecentExp] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showChecklist, setShowChecklist] = useState(true);

  const fmt = (amount) => formatCurrency(amount, currency);

  const fetchMetrics = useCallback(async () => { const res = await api.get('/expenses/dashboard_metrics/'); setMetrics(res.data); }, []);
  const fetchStaffMetrics = useCallback(async () => {
    const [mRes, eRes] = await Promise.all([api.get('/expenses/dashboard_metrics/'), api.get('/expenses/my_expenses/')]);
    setMetrics(mRes.data); setMyExpenses(eRes.data);
  }, []);
  const fetchRecent = useCallback(async () => {
    try { const res = await api.get('/expenses/', { params: { page: 1 } }); const list = res.data.results || res.data; setRecentExp(Array.isArray(list) ? list.slice(0, 8) : []); }
    catch (err) { console.error(err); }
  }, []);

  const fetchBudgetAlerts = useCallback(async () => {
    try { 
      const res = await api.get('/budget-alerts/'); 
      const alerts = res.data.results || res.data;
      setBudgetAlerts(Array.isArray(alerts) ? alerts.filter(a => !a.is_read).slice(0, 5) : []);
    }
    catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    const load = async () => {
      try { 
        const promises = [
          userRole === 'STAFF' ? fetchStaffMetrics() : fetchMetrics(), 
          fetchRecent()
        ];
        if (userRole === 'OWNER') promises.push(fetchBudgetAlerts());
        await Promise.all(promises);
      }
      finally { setLoading(false); }
    };
    load();
  }, [user, userRole, authLoading, navigate, fetchMetrics, fetchStaffMetrics, fetchRecent, fetchBudgetAlerts]);

  const onSuccess = () => { 
    fetchRecent(); 
    userRole === 'STAFF' ? fetchStaffMetrics() : fetchMetrics();
    if (userRole === 'OWNER') fetchBudgetAlerts();
  };

  const handleDismissAlert = async (alertId) => {
    try {
      await api.post(`/budget-alerts/${alertId}/mark_read/`);
      await fetchBudgetAlerts();
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-body" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      <Sidebar currentPage="dashboard" onAddNew={() => setIsModalOpen(true)} />
      <div className="ml-64 flex-1 flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 h-20 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.username}</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/30">
              <span className="material-icons text-lg">add</span>
              New Expense
            </button>
            <div className="w-px h-8 bg-gray-200" />
            <NotificationBell />
            <ProfileDropdown />
          </div>
        </header>

        <div className="flex-1 p-8">
          <div className="grid grid-cols-12 gap-6">
            
            {/* Top Row - Stats Cards */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Today */}
              {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="w-16 h-3 bg-gray-100 rounded mb-3" />
                  <div className="w-32 h-8 bg-gray-100 rounded mb-2" />
                  <div className="w-24 h-3 bg-gray-100 rounded" />
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Today</p>
                      <h3 className="text-3xl font-bold text-gray-900">{fmt(metrics?.today?.total)}</h3>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <span className="material-icons text-blue-600">today</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{metrics?.today?.count || 0} transactions</span>
                    {!!metrics?.today?.growth && (
                      <span className={`font-semibold ${metrics.today.growth > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {metrics.today.growth > 0 ? '+' : ''}{metrics.today.growth}%
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* This Week */}
              {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="w-16 h-3 bg-gray-100 rounded mb-3" />
                  <div className="w-32 h-8 bg-gray-100 rounded mb-2" />
                  <div className="w-24 h-3 bg-gray-100 rounded" />
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">This Week</p>
                      <h3 className="text-3xl font-bold text-gray-900">{fmt(metrics?.week?.total)}</h3>
                    </div>
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <span className="material-icons text-purple-600">date_range</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{metrics?.week?.count || 0} transactions</span>
                    {!!metrics?.week?.growth && (
                      <span className={`font-semibold ${metrics.week.growth > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {metrics.week.growth > 0 ? '+' : ''}{metrics.week.growth}%
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* This Month */}
              {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="w-16 h-3 bg-gray-100 rounded mb-3" />
                  <div className="w-32 h-8 bg-gray-100 rounded mb-2" />
                  <div className="w-24 h-3 bg-gray-100 rounded" />
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">This Month</p>
                      <h3 className="text-3xl font-bold text-gray-900">{fmt(metrics?.month?.total)}</h3>
                    </div>
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <span className="material-icons text-green-600">calendar_month</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{metrics?.month?.count || 0} transactions</span>
                    {!!metrics?.month?.growth && (
                      <span className={`font-semibold ${metrics.month.growth > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {metrics.month.growth > 0 ? '+' : ''}{metrics.month.growth}%
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Budget Alerts Widget (OWNER only) */}
            {!loading && userRole === 'OWNER' && budgetAlerts.length > 0 && (
              <div className="col-span-12 md:col-span-6 bg-white rounded-xl border-2 border-red-200 p-6 shadow-lg shadow-red-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="material-icons text-red-600 text-lg">warning</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Budget Alerts</h3>
                  </div>
                  <Link to="/budgets" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    Manage
                    <span className="material-icons text-sm">arrow_forward</span>
                  </Link>
                </div>
                <div className="space-y-2">
                  {budgetAlerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className={`flex items-start justify-between p-3 rounded-lg border-l-4 ${
                        alert.alert_type === 'EXCEEDED' 
                          ? 'bg-red-50 border-red-500' 
                          : 'bg-amber-50 border-amber-500'
                      }`}
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className={`material-icons text-sm mt-0.5 shrink-0 ${
                          alert.alert_type === 'EXCEEDED' ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {alert.alert_type === 'EXCEEDED' ? 'error' : 'warning'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{alert.budget_name}</p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {alert.percentage}% used · {fmt(alert.amount_spent)}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDismissAlert(alert.id)}
                        className="text-gray-400 hover:text-gray-600 shrink-0 ml-2"
                        title="Dismiss"
                      >
                        <span className="material-icons text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Staff Status Widget */}
            {!loading && userRole === 'STAFF' && myExpenses && (
              <div className="col-span-12 md:col-span-4 bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">My Expense Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="material-icons text-amber-600">schedule</span>
                      <span className="text-sm font-medium text-gray-700">Pending</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-600">{myExpenses.pending.count}</p>
                      <p className="text-xs text-gray-500">{fmt(myExpenses.pending.total)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="material-icons text-green-600">check_circle</span>
                      <span className="text-sm font-medium text-gray-700">Approved</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{myExpenses.approved.count}</p>
                      <p className="text-xs text-gray-500">{fmt(myExpenses.approved.total)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="material-icons text-red-600">cancel</span>
                      <span className="text-sm font-medium text-gray-700">Rejected</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{myExpenses.rejected.count}</p>
                      <p className="text-xs text-gray-500">Resubmit</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Access */}
            <div className={`col-span-12 ${
              (!loading && userRole === 'STAFF' && myExpenses) || (!loading && userRole === 'OWNER' && budgetAlerts.length > 0) 
                ? 'md:col-span-6' 
                : ''
            } bg-white rounded-xl border border-gray-200 p-6`}>
              <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Access</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-500 rounded-lg flex items-center justify-center transition-colors">
                    <span className="material-icons text-blue-600 group-hover:text-white">add_circle</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">New Expense</span>
                </button>
                <Link 
                  to="/expenses"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
                >
                  <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-500 rounded-lg flex items-center justify-center transition-colors">
                    <span className="material-icons text-purple-600 group-hover:text-white">receipt_long</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">All Expenses</span>
                </Link>
                <Link 
                  to="/reports"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <div className="w-10 h-10 bg-green-100 group-hover:bg-green-500 rounded-lg flex items-center justify-center transition-colors">
                    <span className="material-icons text-green-600 group-hover:text-white">assessment</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Reports</span>
                </Link>
                <Link 
                  to="/budgets"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all group"
                >
                  <div className="w-10 h-10 bg-orange-100 group-hover:bg-orange-500 rounded-lg flex items-center justify-center transition-colors">
                    <span className="material-icons text-orange-600 group-hover:text-white">account_balance_wallet</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Budgets</span>
                </Link>
              </div>
            </div>

            {/* Recent Expenses Table */}
            <div className="col-span-12 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Recent Expenses</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Latest transactions from your team</p>
                </div>
                <Link to="/expenses" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View all
                  <span className="material-icons text-sm">arrow_forward</span>
                </Link>
              </div>

              {loading ? (
                <div className="divide-y divide-gray-50">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="px-6 py-3 flex items-center gap-4 animate-pulse">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="w-32 h-3 bg-gray-100 rounded" />
                        <div className="w-20 h-2 bg-gray-100 rounded" />
                      </div>
                      <div className="w-20 h-3 bg-gray-100 rounded" />
                      <div className="w-16 h-3 bg-gray-100 rounded" />
                      <div className="w-14 h-5 bg-gray-100 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : recentExp.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="material-icons text-2xl text-gray-300">receipt_long</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 mb-1">No expenses yet</p>
                    <p className="text-xs text-gray-500 mb-3">Start tracking your expenses</p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Add your first expense
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentExp.map((exp) => (
                        <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: `${CAT_COLOR[exp.category] || CAT_COLOR.OTHER}15` }}
                              >
                                <span
                                  className="material-icons text-sm"
                                  style={{ color: CAT_COLOR[exp.category] || CAT_COLOR.OTHER }}
                                >
                                  receipt
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-gray-800">{exp.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <span className="text-sm text-gray-600">{exp.user_details?.username || '-'}</span>
                          </td>
                          <td className="px-6 py-3">
                            <span className="text-xs font-medium text-gray-500">{CAT_LABEL[exp.category] || exp.category}</span>
                          </td>
                          <td className="px-6 py-3">
                            <span className="text-xs text-gray-500">
                              {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className="text-sm font-bold text-gray-900">{fmt(exp.amount)}</span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span
                              className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                                STATUS_STYLE[exp.status] || STATUS_STYLE.PENDING
                              }`}
                            >
                              {exp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={onSuccess} />
      {showChecklist && <OnboardingChecklist onClose={() => setShowChecklist(false)} />}
    </div>
  );
}

export default Dashboard;
