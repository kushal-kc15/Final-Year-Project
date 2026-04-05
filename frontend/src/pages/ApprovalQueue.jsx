import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { formatCurrency } from '../utils/currency';

const CAT_COLOR = {
  FOOD:      { bg: '#fff7ed', accent: '#f97316' },
  TRANSPORT: { bg: '#eff6ff', accent: '#3b82f6' },
  OFFICE:    { bg: '#f5f3ff', accent: '#8b5cf6' },
  UTILITIES: { bg: '#ecfeff', accent: '#06b6d4' },
  SALARY:    { bg: '#f0fdf4', accent: '#10b981' },
  RENT:      { bg: '#fdf2f8', accent: '#ec4899' },
  MARKETING: { bg: '#fffbeb', accent: '#f59e0b' },
  OTHER:     { bg: '#f8fafc', accent: '#94a3b8' },
};

const CAT_LABEL = {
  FOOD: 'Food & Dining', TRANSPORT: 'Transport', OFFICE: 'Office Supplies',
  UTILITIES: 'Utilities', SALARY: 'Salary & Wages', RENT: 'Rent',
  MARKETING: 'Marketing', OTHER: 'Other',
};

function ApprovalQueue() {
  const navigate = useNavigate();
  const { role: userRole, currency } = useAuth();
  
  const fmt = (amount) => formatCurrency(amount, currency);

  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [confirmState,    setConfirmState]    = useState({ open: false, expenseId: null });
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [rejectReason,    setRejectReason]    = useState('');
  const [processing,      setProcessing]      = useState(false);
  const [toast,           setToast]           = useState(null);
  const [activeId,        setActiveId]        = useState(null); // expanded card

  useEffect(() => {
    if (userRole === 'STAFF') { navigate('/dashboard'); return; }
    fetchData();
  }, [userRole, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/expenses/pending_approvals/');
      setPendingExpenses(res.data);
      if (res.data.length > 0) setActiveId(res.data[0].id);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    } finally { setLoading(false); }
  };

  const showToast = (message, type = 'error') => setToast({ message, type });

  const handleApproveConfirm = async () => {
    const { expenseId } = confirmState;
    setConfirmState({ open: false, expenseId: null });
    try {
      setProcessing(true);
      await api.post(`/expenses/${expenseId}/approve/`);
      showToast('Expense approved successfully.', 'success');
      await fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed to approve.'); }
    finally { setProcessing(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast('Please provide a rejection reason.'); return; }
    try {
      setProcessing(true);
      await api.post(`/expenses/${selectedExpense.id}/reject/`, { reason: rejectReason });
      setShowRejectModal(false); setSelectedExpense(null); setRejectReason('');
      showToast('Expense rejected.', 'info');
      await fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed to reject.'); }
    finally { setProcessing(false); }
  };

  const totalAmount = pendingExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const activeExp   = pendingExpenses.find(e => e.id === activeId);
  const cat         = activeExp ? (CAT_COLOR[activeExp.category] || CAT_COLOR.OTHER) : null;

  return (
    <div className="flex min-h-screen bg-slate-50 font-body">
      <Sidebar currentPage="approvals" />

      <div className="ml-64 flex-1 flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 h-16 flex items-center justify-between shrink-0">
          <h1 className="font-display text-lg font-700 text-slate-900">Approvals</h1>
          {!loading && pendingExpenses.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-amber-700">
                {pendingExpenses.length} awaiting review · {fmt(totalAmount)}
              </span>
            </div>
          )}
        </header>

        {/* Body */}
        {loading ? (
          <div className="flex-1 flex">
            {/* Left skeleton */}
            <div className="w-80 shrink-0 border-r border-slate-200 bg-white p-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-4 animate-pulse space-y-2">
                  <div className="w-36 h-3.5 bg-slate-100 rounded" />
                  <div className="w-24 h-3 bg-slate-100 rounded" />
                  <div className="w-20 h-5 bg-slate-100 rounded mt-2" />
                </div>
              ))}
            </div>
            {/* Right skeleton */}
            <div className="flex-1 p-10 animate-pulse space-y-6">
              <div className="w-48 h-6 bg-slate-100 rounded" />
              <div className="w-32 h-10 bg-slate-100 rounded" />
              <div className="w-full h-24 bg-slate-100 rounded-xl" />
            </div>
          </div>
        ) : pendingExpenses.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <span className="material-icons text-4xl text-emerald-400">check_circle</span>
            </div>
            <div className="text-center">
              <h3 className="font-display text-xl font-700 text-slate-900 mb-1">All caught up!</h3>
              <p className="text-sm text-slate-500">No pending expenses to review right now.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">

            {/* ── Left: expense list ──────────────────────────────────── */}
            <aside className="w-80 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
              <div className="p-3 space-y-1.5">
                {pendingExpenses.map(exp => {
                  const c       = CAT_COLOR[exp.category] || CAT_COLOR.OTHER;
                  const isActive = exp.id === activeId;
                  return (
                    <button
                      key={exp.id}
                      onClick={() => setActiveId(exp.id)}
                      className={`w-full text-left rounded-xl p-4 transition-all border ${
                        isActive
                          ? 'border-brand-200 bg-brand-50'
                          : 'border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className={`text-sm font-semibold leading-tight line-clamp-2 ${isActive ? 'text-brand-900' : 'text-slate-800'}`}>
                          {exp.title}
                        </p>
                        <div
                          className="w-2 h-2 rounded-full mt-1 shrink-0"
                          style={{ background: c.accent }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">{CAT_LABEL[exp.category] || exp.category}</span>
                        <span className={`font-display text-sm font-700 ${isActive ? 'text-brand-700' : 'text-slate-700'}`}>
                          {fmt(exp.amount)}
                        </span>
                      </div>
                      {exp.user_details && (
                        <p className="text-[11px] text-slate-400 mt-1">by {exp.user_details.username}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* ── Right: detail + actions ─────────────────────────────── */}
            {activeExp && cat && (
              <main className="flex-1 overflow-y-auto p-10">
                <div className="max-w-2xl mx-auto space-y-8">

                  {/* Category accent + title */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: cat.bg }}
                      >
                        <span className="material-icons text-[24px]" style={{ color: cat.accent }}>receipt_long</span>
                      </div>
                      <span
                        className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{ background: `${cat.accent}18`, color: cat.accent }}
                      >
                        {CAT_LABEL[activeExp.category] || activeExp.category}
                      </span>
                    </div>

                    <h2 className="font-display text-3xl font-800 text-slate-900 leading-tight mb-2">
                      {activeExp.title}
                    </h2>
                    <p className="font-display text-5xl font-800 leading-none" style={{ color: cat.accent }}>
                      {fmt(activeExp.amount)}
                    </p>
                  </div>

                  {/* Meta grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Submitted by', value: activeExp.user_details?.username || '—', icon: 'person' },
                      { label: 'Expense date', value: new Date(activeExp.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), icon: 'calendar_today' },
                      { label: 'Submitted on', value: new Date(activeExp.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), icon: 'schedule' },
                      { label: 'Status', value: 'Pending Review', icon: 'hourglass_empty' },
                    ].map(m => (
                      <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="material-icons text-slate-400 text-[16px]">{m.icon}</span>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  {activeExp.description && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Description</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{activeExp.description}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setConfirmState({ open: true, expenseId: activeExp.id })}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 text-sm shadow-sm"
                    >
                      <span className="material-icons text-[18px]">check_circle</span>
                      Approve Expense
                    </button>
                    <button
                      onClick={() => { setSelectedExpense(activeExp); setRejectReason(''); setShowRejectModal(true); }}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 text-sm border-2 border-red-200 hover:border-red-300"
                    >
                      <span className="material-icons text-[18px]">cancel</span>
                      Reject Expense
                    </button>
                  </div>

                  {/* Counter */}
                  <p className="text-center text-xs text-slate-400">
                    {pendingExpenses.findIndex(e => e.id === activeId) + 1} of {pendingExpenses.length} pending
                  </p>
                </div>
              </main>
            )}
          </div>
        )}
      </div>

      {/* Approve confirm */}
      <ConfirmModal
        isOpen={confirmState.open}
        title="Approve Expense"
        message="Are you sure you want to approve this expense?"
        confirmLabel="Approve"
        variant="primary"
        onConfirm={handleApproveConfirm}
        onCancel={() => setConfirmState({ open: false, expenseId: null })}
      />

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <span className="material-icons text-red-600">cancel</span>
              </div>
              <div>
                <h3 className="font-display font-700 text-slate-900">Reject Expense</h3>
                <p className="text-xs text-slate-500 truncate">{selectedExpense?.title}</p>
              </div>
            </div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Reason for Rejection
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Explain why this expense is being rejected…"
              rows={4}
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all resize-none mb-5"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={processing}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
              >
                {processing ? 'Rejecting…' : 'Reject Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default ApprovalQueue;