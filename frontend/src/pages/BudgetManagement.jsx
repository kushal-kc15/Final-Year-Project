import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import ProfileDropdown from '../components/ProfileDropdown';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

const EMPTY_FORM = {
  name: '', amount: '', period: 'MONTHLY',
  category: 'ALL', alert_threshold: 80, is_active: true,
};

const PERIOD_LABEL = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', YEARLY: 'Yearly' };

const inputClass = 'w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900';
const labelClass = 'block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2';

// ── Budget row ───────────────────────────────────────────────────────────────
function BudgetRow({ budget, onEdit, onDelete, fmt }) {
  const pct    = budget.percentage_used || 0;
  const over   = pct > 100;
  const warn   = pct >= budget.alert_threshold && !over;
  const good   = pct < 70;
  const caution = pct >= 70 && pct < budget.alert_threshold;

  const statusLabel = over ? 'Over budget' : warn ? 'Near limit' : caution ? 'Caution' : 'On track';
  const statusStyle = over ? 'bg-red-50 text-red-600 border-red-200'
                    : warn ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : caution ? 'bg-orange-50 text-orange-600 border-orange-200'
                           : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const barColor = over ? 'bg-red-500' : warn ? 'bg-amber-500' : caution ? 'bg-orange-400' : 'bg-emerald-500';
  const borderColor = over ? 'border-red-200 shadow-red-100' : warn ? 'border-amber-200 shadow-amber-100' : caution ? 'border-orange-200 shadow-orange-100' : 'border-gray-200';

  return (
    <div className={`bg-white border-2 rounded-xl hover:shadow-lg transition-all ${!budget.is_active ? 'opacity-60' : ''} ${borderColor} shadow-md`}>
      <div className="p-6">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-gray-900 truncate">{budget.name}</h3>
              {!budget.is_active && (
                <span className="text-xs font-bold uppercase tracking-wide text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Inactive</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="material-icons text-sm">schedule</span>
                {PERIOD_LABEL[budget.period] || budget.period}
              </span>
              <span>·</span>
              <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                budget.category === 'ALL' 
                  ? 'bg-blue-50 text-blue-700 font-semibold' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                <span className="material-icons text-sm">
                  {budget.category === 'ALL' ? 'dashboard' : 'category'}
                </span>
                {budget.category === 'ALL' ? 'Tracking all categories' : `${budget.category} only`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 ml-4">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${statusStyle}`}>
              {statusLabel}
            </span>
            <div className="flex gap-1">
              <button onClick={() => onEdit(budget)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <span className="material-icons text-lg">edit</span>
              </button>
              <button onClick={() => onDelete(budget.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <span className="material-icons text-lg">delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-5 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">Progress</span>
            <span className={`text-base font-bold ${
              over ? 'text-red-600' : warn ? 'text-amber-600' : caution ? 'text-orange-600' : 'text-emerald-600'
            }`}>
              {pct.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-gray-200 shadow-inner">
            <div 
              className={`h-full ${barColor} transition-all duration-700 rounded-full`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          {over && (
            <p className="text-xs text-red-600 font-semibold mt-2 flex items-center gap-1">
              <span className="material-icons text-xs">error</span>
              Budget exceeded by {fmt(Math.abs(budget.remaining_amount))}
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1 font-semibold">Budget</p>
            <p className="text-base font-bold text-gray-900">{fmt(budget.amount)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1 font-semibold">Spent</p>
            <p className="text-base font-bold text-gray-900">{fmt(budget.spent_amount)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1 font-semibold">Remaining</p>
            <p className={`text-base font-bold ${over ? 'text-red-600' : 'text-gray-900'}`}>
              {over ? `−${fmt(Math.abs(budget.remaining_amount))}` : fmt(budget.remaining_amount)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1 font-semibold">Alert at</p>
            <p className="text-base font-bold text-gray-900">{budget.alert_threshold}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
function BudgetManagement() {
  const navigate = useNavigate();
  const { user, role: userRole, loading: authLoading, currency } = useAuth();
  
  const fmt = (amount) => formatCurrency(amount, currency);

  const [budgets,       setBudgets]       = useState([]);
  const [alerts,        setAlerts]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData,      setFormData]      = useState(EMPTY_FORM);
  const [confirmState,  setConfirmState]  = useState({ open: false, budgetId: null });
  const [toast,         setToast]         = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    if (userRole === 'OWNER') {
      Promise.all([fetchBudgets(), fetchAlerts()]).finally(() => setLoading(false));
    } else { setLoading(false); }
  }, [user, userRole, authLoading, navigate]);

  const fetchBudgets = async () => { try { const r = await api.get('/budgets/'); setBudgets(r.data.results || r.data); } catch (e) { console.error(e); } };
  const fetchAlerts  = async () => { try { const r = await api.get('/budget-alerts/'); setAlerts(r.data.results || r.data); } catch (e) { console.error(e); } };
  const markRead     = async (id) => { try { await api.post(`/budget-alerts/${id}/mark_read/`); await fetchAlerts(); } catch (e) { console.error(e); } };
  const showToast    = (message, type = 'error') => setToast({ message, type });

  const openCreate = () => { setEditingBudget(null); setFormData(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit   = (b)  => { setEditingBudget(b); setFormData({ name: b.name, amount: b.amount, period: b.period, category: b.category, alert_threshold: b.alert_threshold, is_active: b.is_active }); setIsModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBudget) { await api.put(`/budgets/${editingBudget.id}/`, formData); showToast('Budget updated.', 'success'); }
      else { await api.post('/budgets/', formData); showToast('Budget created.', 'success'); }
      setIsModalOpen(false); setEditingBudget(null); setFormData(EMPTY_FORM);
      await fetchBudgets(); await fetchAlerts();
    } catch (err) { showToast(err.response?.data?.detail || 'Failed to save budget.'); }
  };

  const handleDeleteConfirm = async () => {
    const { budgetId } = confirmState;
    setConfirmState({ open: false, budgetId: null });
    try { await api.delete(`/budgets/${budgetId}/`); showToast('Budget deleted.', 'info'); await fetchBudgets(); }
    catch { showToast('Failed to delete budget.'); }
  };

  // Access denied
  if (!authLoading && !loading && userRole !== 'OWNER') {
    return (
      <div className="flex min-h-screen bg-gray-50 font-body" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
        <Sidebar currentPage="budgets" />
        <div className="ml-64 flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-icons text-5xl text-gray-200 mb-3 block">lock</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-sm text-gray-500 mb-4">Only owners can manage budgets.</p>
            <Link to="/dashboard" className="text-sm font-semibold text-blue-600 hover:underline">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const unreadAlerts = alerts.filter(a => !a.is_read);
  const totalBudgeted = budgets.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const totalSpent    = budgets.reduce((s, b) => s + parseFloat(b.spent_amount || 0), 0);
  const onTrackCount = budgets.filter(b => b.is_active && (b.percentage_used || 0) < 70).length;
  const exceededCount = budgets.filter(b => b.is_active && (b.percentage_used || 0) > 100).length;

  return (
    <div className="flex min-h-screen bg-gray-50 font-body" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      <Sidebar currentPage="budgets" />

      <div className="ml-64 flex-1 flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 h-20 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Set spending limits and track utilization</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadAlerts.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-sm font-semibold text-amber-700">{unreadAlerts.length} alert{unreadAlerts.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-sm">
              <span className="material-icons text-lg">add</span>
              New Budget
            </button>
            <NotificationBell />
            <div className="w-px h-8 bg-gray-200" />
            <ProfileDropdown />
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">

          {/* Info Banner - Explaining Budgets vs Categories */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <span className="material-icons text-white text-lg">info</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  Understanding Budgets & Categories
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
                    <p className="font-semibold text-blue-900 mb-1 flex items-center gap-1.5">
                      <span className="material-icons text-sm">category</span>
                      Categories (What)
                    </p>
                    <p className="text-xs text-gray-600">
                      Labels to classify expenses: Food, Transport, Office, etc. Every expense must have a category.
                    </p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
                    <p className="font-semibold text-blue-900 mb-1 flex items-center gap-1.5">
                      <span className="material-icons text-sm">account_balance</span>
                      Budgets (How Much)
                    </p>
                    <p className="text-xs text-gray-600">
                      Spending limits you set. Track one category or ALL categories combined. Get alerts when near limit.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {!loading && budgets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="material-icons text-gray-600 text-lg">account_balance</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Budgeted</p>
                    <p className="text-2xl font-bold text-gray-900">{fmt(totalBudgeted)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="material-icons text-gray-600 text-lg">payments</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">{fmt(totalSpent)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="material-icons text-emerald-600 text-lg">check_circle</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">On Track</p>
                    <p className="text-2xl font-bold text-emerald-600">{onTrackCount}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="material-icons text-red-600 text-lg">error</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Exceeded</p>
                    <p className="text-2xl font-bold text-red-600">{exceededCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alerts */}
          {!loading && unreadAlerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900">Active Alerts</h3>
              {unreadAlerts.map(alert => (
                <div key={alert.id} className={`flex items-start justify-between p-4 rounded-xl border-l-4 ${
                  alert.alert_type === 'EXCEEDED' ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className={`material-icons text-sm mt-0.5 ${alert.alert_type === 'EXCEEDED' ? 'text-red-500' : 'text-amber-500'}`}>
                      {alert.alert_type === 'EXCEEDED' ? 'error' : 'warning'}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{alert.budget_name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                  <button onClick={() => markRead(alert.id)}
                    className="text-xs font-semibold text-blue-600 hover:underline shrink-0 ml-4">
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Budget list */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
                  <div className="flex justify-between mb-4">
                    <div className="space-y-2">
                      <div className="w-48 h-4 bg-gray-100 rounded" />
                      <div className="w-32 h-3 bg-gray-100 rounded" />
                    </div>
                    <div className="w-24 h-8 bg-gray-100 rounded-full" />
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full mb-4" />
                  <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="space-y-1">
                        <div className="w-16 h-3 bg-gray-100 rounded" />
                        <div className="w-20 h-4 bg-gray-100 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : budgets.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
              <span className="material-icons text-5xl text-gray-200 mb-4 block">account_balance</span>
              <h3 className="font-bold text-gray-900 mb-1">No budgets yet</h3>
              <p className="text-sm text-gray-500 mb-6">Create your first budget to start tracking spending limits.</p>
              <button onClick={openCreate}
                className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors">
                <span className="material-icons text-lg">add</span> Create Budget
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map(budget => (
                <BudgetRow
                  key={budget.id}
                  budget={budget}
                  onEdit={openEdit}
                  onDelete={(id) => setConfirmState({ open: true, budgetId: id })}
                  fmt={fmt}
                />
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-7">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingBudget ? 'Edit Budget' : 'Create Budget'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingBudget(null); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Budget Name</label>
                <input type="text" required value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass} placeholder="e.g. Monthly Marketing Budget" />
              </div>

              <div>
                <label className={labelClass}>Amount ({currency})</label>
                <input type="number" required min="0.01" step="0.01" value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className={inputClass} placeholder="10000" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Period</label>
                  <select value={formData.period} onChange={e => setFormData({ ...formData, period: e.target.value })} className={inputClass}>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    Category to Track
                    <span className="material-icons text-xs text-gray-400 ml-1 cursor-help" title="Select which expense category this budget will track">help</span>
                  </label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className={inputClass}>
                    <option value="ALL">🌐 All Categories</option>
                    <option value="FOOD">🍽️ Food & Dining</option>
                    <option value="TRANSPORT">🚗 Transportation</option>
                    <option value="OFFICE">📎 Office Supplies</option>
                    <option value="UTILITIES">💡 Utilities</option>
                    <option value="SALARY">💰 Salary & Wages</option>
                    <option value="RENT">🏢 Rent</option>
                    <option value="MARKETING">📢 Marketing</option>
                    <option value="OTHER">📦 Other</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {formData.category === 'ALL' 
                      ? 'This budget will track expenses from all categories combined'
                      : `This budget will only track expenses in the ${formData.category} category`
                    }
                  </p>
                </div>
              </div>

              <div>
                <label className={labelClass}>Alert Threshold — {formData.alert_threshold}%</label>
                <input type="range" min="1" max="100" value={formData.alert_threshold}
                  onChange={e => setFormData({ ...formData, alert_threshold: parseInt(e.target.value) })}
                  className="w-full accent-blue-600" />
                <p className="text-xs text-gray-400 mt-1">Get alerted when spending hits this percentage</p>
              </div>

              <div className="flex items-center gap-2.5">
                <input type="checkbox" id="is_active" checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-600" />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active Budget</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingBudget(null); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 text-sm transition-colors">
                  {editingBudget ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.open}
        title="Delete Budget"
        message="This will permanently delete the budget. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmState({ open: false, budgetId: null })}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default BudgetManagement;