import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

const EMPTY_FORM = {
  name: '', amount: '', period: 'MONTHLY',
  category: 'ALL', alert_threshold: 80, is_active: true,
};

const PERIOD_LABEL = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', YEARLY: 'Yearly' };

const inputClass = 'w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all text-slate-900';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5';

// ── Budget card ───────────────────────────────────────────────────────────────
function BudgetCard({ budget, onEdit, onDelete, fmt }) {
  const pct    = Math.min(budget.percentage_used || 0, 100);
  const over   = budget.percentage_used > 100;
  const warn   = budget.percentage_used >= budget.alert_threshold && !over;

  const trackColor = over  ? '#ef4444'
                   : warn  ? '#f59e0b'
                           : '#3B5BDB';

  const statusLabel = over ? 'Over budget' : warn ? 'Near limit' : 'On track';
  const statusStyle = over ? 'bg-red-50 text-red-600'
                    : warn ? 'bg-amber-50 text-amber-700'
                           : 'bg-emerald-50 text-emerald-700';

  // Arc math for the circular progress
  const r   = 28;
  const cx  = 36;
  const cy  = 36;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);

  return (
    <div className={`bg-white rounded-2xl border shadow-card hover:shadow-card-hover transition-all flex flex-col ${!budget.is_active ? 'opacity-60' : ''} ${over ? 'border-red-200' : warn ? 'border-amber-200' : 'border-slate-200'}`}>

      {/* Top accent line */}
      <div className="h-1 rounded-t-2xl" style={{ background: trackColor }} />

      <div className="p-6 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-display font-700 text-slate-900 truncate">{budget.name}</h3>
              {!budget.is_active && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Inactive</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{PERIOD_LABEL[budget.period] || budget.period}</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-400">{budget.category === 'ALL' ? 'All categories' : budget.category}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1 shrink-0 ml-3">
            <button onClick={() => onEdit(budget)}
              className="p-1.5 text-slate-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors">
              <span className="material-icons text-sm">edit</span>
            </button>
            <button onClick={() => onDelete(budget.id)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <span className="material-icons text-sm">delete</span>
            </button>
          </div>
        </div>

        {/* Main content — circular progress + stats */}
        <div className="flex items-center gap-6 flex-1">
          {/* Circular progress */}
          <div className="shrink-0">
            <svg width="72" height="72" className="-rotate-90">
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
              <circle
                cx={cx} cy={cy} r={r} fill="none"
                stroke={trackColor} strokeWidth="6"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <p className="text-center font-display text-sm font-700 -mt-[52px] w-[72px]" style={{ color: trackColor }}>
              {budget.percentage_used || 0}%
            </p>
            <div className="mt-[32px]" />
          </div>

          {/* Numbers */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Spent</p>
              <p className="font-display text-xl font-700 text-slate-900">{fmt(budget.spent_amount)}</p>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Budget</p>
                <p className="text-sm font-bold text-slate-700">{fmt(budget.amount)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-0.5">Remaining</p>
                <p className={`text-sm font-bold ${over ? 'text-red-600' : 'text-slate-700'}`}>
                  {over ? `−${fmt(Math.abs(budget.remaining_amount))}` : fmt(budget.remaining_amount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusStyle}`}>
            {statusLabel}
          </span>
          <span className="text-xs text-slate-400">Alert at {budget.alert_threshold}%</span>
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
    if (userRole === 'OWNER' || userRole === 'MANAGER') {
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
  if (!authLoading && !loading && userRole !== 'OWNER' && userRole !== 'MANAGER') {
    return (
      <div className="flex min-h-screen bg-slate-50 font-body">
        <Sidebar currentPage="budgets" />
        <div className="ml-64 flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-icons text-5xl text-slate-200 mb-3 block">lock</span>
            <h2 className="font-display text-xl font-700 text-slate-900 mb-2">Access Denied</h2>
            <p className="text-sm text-slate-500 mb-4">Only owners and managers can manage budgets.</p>
            <Link to="/dashboard" className="text-sm font-semibold text-brand-700 hover:underline">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const unreadAlerts = alerts.filter(a => !a.is_read);
  const totalBudgeted = budgets.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const totalSpent    = budgets.reduce((s, b) => s + parseFloat(b.spent_amount || 0), 0);

  return (
    <div className="flex min-h-screen bg-slate-50 font-body">
      <Sidebar currentPage="budgets" />

      <div className="ml-64 flex-1 flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 h-16 flex items-center justify-between shrink-0">
          <h1 className="font-display text-lg font-700 text-slate-900">Budgets</h1>
          <div className="flex items-center gap-3">
            {unreadAlerts.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-bold text-amber-700">{unreadAlerts.length} alert{unreadAlerts.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
              <span className="material-icons text-[18px]">add</span>
              New Budget
            </button>
          </div>
        </header>

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">

          <div>
            <h2 className="font-display text-2xl font-700 text-slate-900">Budget Overview</h2>
            <p className="text-sm text-slate-500 mt-0.5">Set spending limits and track utilization.</p>
          </div>

          {/* Summary strip */}
          {!loading && budgets.length > 0 && (
            <div className="grid grid-cols-3 gap-5">
              {[
                { label: 'Total Budgeted', value: fmt(totalBudgeted), icon: 'account_balance', bg: 'bg-brand-50', color: 'text-brand-700' },
                { label: 'Total Spent', value: fmt(totalSpent), icon: 'payments', bg: 'bg-violet-50', color: 'text-violet-600' },
                { label: 'Active Budgets', value: budgets.filter(b => b.is_active).length, icon: 'task_alt', bg: 'bg-emerald-50', color: 'text-emerald-600' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
                    <span className={`material-icons text-[20px] ${s.color}`}>{s.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{s.label}</p>
                    <p className="font-display text-xl font-700 text-slate-900">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Alerts */}
          {!loading && unreadAlerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Active Alerts</p>
              {unreadAlerts.map(alert => (
                <div key={alert.id} className={`flex items-start justify-between p-4 rounded-xl border-l-4 ${
                  alert.alert_type === 'EXCEEDED' ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className={`material-icons text-sm mt-0.5 ${alert.alert_type === 'EXCEEDED' ? 'text-red-500' : 'text-amber-500'}`}>
                      {alert.alert_type === 'EXCEEDED' ? 'error' : 'warning'}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{alert.budget_name}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                  <button onClick={() => markRead(alert.id)}
                    className="text-xs font-semibold text-brand-700 hover:underline shrink-0 ml-4">
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Budget cards grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4 h-52">
                  <div className="flex justify-between">
                    <div className="space-y-1.5"><div className="w-36 h-4 bg-slate-100 rounded" /><div className="w-24 h-3 bg-slate-100 rounded" /></div>
                    <div className="w-16 h-16 rounded-full bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-2 bg-slate-100 rounded-full" />
                    <div className="flex justify-between"><div className="w-20 h-3 bg-slate-100 rounded" /><div className="w-20 h-3 bg-slate-100 rounded" /></div>
                  </div>
                </div>
              ))}
            </div>
          ) : budgets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-card">
              <span className="material-icons text-5xl text-slate-200 mb-4 block">account_balance</span>
              <h3 className="font-display font-700 text-slate-900 mb-1">No budgets yet</h3>
              <p className="text-sm text-slate-500 mb-6">Create your first budget to start tracking spending limits.</p>
              <button onClick={openCreate}
                className="inline-flex items-center gap-2 bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-800 transition-colors">
                <span className="material-icons text-[18px]">add</span> Create Budget
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {budgets.map(budget => (
                <BudgetCard
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-7">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl font-700 text-slate-900">
                {editingBudget ? 'Edit Budget' : 'Create Budget'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingBudget(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
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
                  <label className={labelClass}>Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className={inputClass}>
                    <option value="ALL">All Categories</option>
                    <option value="FOOD">Food</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="OFFICE">Office</option>
                    <option value="UTILITIES">Utilities</option>
                    <option value="SALARY">Salary</option>
                    <option value="RENT">Rent</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Alert Threshold — {formData.alert_threshold}%</label>
                <input type="range" min="1" max="100" value={formData.alert_threshold}
                  onChange={e => setFormData({ ...formData, alert_threshold: parseInt(e.target.value) })}
                  className="w-full accent-brand-700" />
                <p className="text-xs text-slate-400 mt-1">Get alerted when spending hits this percentage</p>
              </div>

              <div className="flex items-center gap-2.5">
                <input type="checkbox" id="is_active" checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-700 border-slate-300 focus:ring-brand-700" />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active Budget</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingBudget(null); }}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-brand-700 text-white font-semibold rounded-xl hover:bg-brand-800 text-sm transition-colors">
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