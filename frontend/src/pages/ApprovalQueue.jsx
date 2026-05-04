import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import ProfileDropdown from '../components/ProfileDropdown';
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [confirmState,    setConfirmState]    = useState({ open: false, expenseId: null });
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [rejectReason,    setRejectReason]    = useState('');
  const [processing,      setProcessing]      = useState(false);
  const [toast,           setToast]           = useState(null);
  const [currentPage,     setCurrentPage]     = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (userRole === 'STAFF') { navigate('/dashboard'); return; }
    fetchData();
  }, [userRole, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const res = await api.get('/expenses/pending_approvals/');
      setPendingExpenses(res.data);
      
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
      setShowDetailModal(false);
      await fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed to approve.'); }
    finally { setProcessing(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast('Please provide a rejection reason.'); return; }
    try {
      setProcessing(true);
      await api.post(`/expenses/${selectedExpense.id}/reject/`, { reason: rejectReason });
      setShowRejectModal(false); 
      setShowDetailModal(false);
      setSelectedExpense(null); 
      setRejectReason('');
      showToast('Expense rejected.', 'info');
      await fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed to reject.'); }
    finally { setProcessing(false); }
  };

  const totalAmount = pendingExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  
  // Pagination
  const totalPages = Math.ceil(pendingExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExpenses = pendingExpenses.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-body" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      <Sidebar currentPage="approvals" />

      <div className="ml-64 flex-1 flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 h-20 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Approval Queue</h1>
            <p className="text-sm text-gray-500 mt-0.5">Review and approve pending expenses</p>
          </div>
          <div className="flex items-center gap-3">
            {!loading && pendingExpenses.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-sm font-semibold text-amber-700">
                  {pendingExpenses.length} awaiting review · {fmt(totalAmount)}
                </span>
              </div>
            )}
            <NotificationBell />
            <div className="w-px h-8 bg-gray-200" />
            <ProfileDropdown />
          </div>
        </header>

        {/* Summary Cards */}
        {!loading && pendingExpenses.length > 0 && (
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Pending Review</p>
                <p className="text-2xl font-bold text-amber-900">{pendingExpenses.length}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-blue-900">{fmt(totalAmount)}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Avg Amount</p>
                <p className="text-2xl font-bold text-purple-900">{fmt(totalAmount / pendingExpenses.length)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        {loading ? (
          <div className="flex-1 p-8">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="w-48 h-4 bg-gray-100 rounded" />
                      <div className="w-32 h-3 bg-gray-100 rounded" />
                    </div>
                    <div className="w-24 h-4 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : pendingExpenses.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <span className="material-icons text-4xl text-emerald-400">check_circle</span>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-1">All caught up!</h3>
              <p className="text-sm text-gray-500">No pending expenses to review right now.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-8">
            <div className="max-w-5xl mx-auto">
              
              {/* Expense List */}
              <div className="space-y-3 mb-6">
                {currentExpenses.map((exp) => {
                  const cat = CAT_COLOR[exp.category] || CAT_COLOR.OTHER;
                  return (
                    <button
                      key={exp.id}
                      onClick={() => { setSelectedExpense(exp); setShowDetailModal(true); }}
                      className="w-full bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-md transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: cat.bg }}
                        >
                          <span className="material-icons text-xl" style={{ color: cat.accent }}>receipt_long</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate mb-1">{exp.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <span className="material-icons text-sm">person</span>
                              {exp.user_details?.username || '—'}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-icons text-sm">calendar_today</span>
                              {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
                              {CAT_LABEL[exp.category] || exp.category}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <p className="text-xl font-bold text-gray-900">{fmt(exp.amount)}</p>
                        </div>
                        
                        <span className="material-icons text-gray-400">chevron_right</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-6 py-4">
                  <p className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, pendingExpenses.length)} of {pendingExpenses.length} expenses
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-icons text-sm">first_page</span>
                    </button>
                    
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-icons text-sm">chevron_left</span>
                    </button>
                    
                    {getPageNumbers().map((page, idx) => (
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-gray-400">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                            currentPage === page
                              ? 'bg-gray-900 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    ))}
                    
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-icons text-sm">chevron_right</span>
                    </button>
                    
                    <button
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-icons text-sm">last_page</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {(() => {
              const cat = CAT_COLOR[selectedExpense.category] || CAT_COLOR.OTHER;
              return (
                <>
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: cat.bg }}
                      >
                        <span className="material-icons text-xl" style={{ color: cat.accent }}>receipt_long</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Expense Details</h2>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg inline-block mt-1">
                          {CAT_LABEL[selectedExpense.category] || selectedExpense.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="material-icons">close</span>
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      
                      {/* Left Side - Details */}
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {selectedExpense.title}
                        </h3>
                        <p className="text-4xl font-bold text-gray-900 mb-6">
                          {fmt(selectedExpense.amount)}
                        </p>

                        <div className="space-y-4 mb-6">
                          <div className="flex items-center gap-3">
                            <span className="material-icons text-gray-400 text-lg">person</span>
                            <div>
                              <p className="text-xs text-gray-500">Submitted by</p>
                              <p className="text-sm font-semibold text-gray-900">{selectedExpense.user_details?.username || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="material-icons text-gray-400 text-lg">calendar_today</span>
                            <div>
                              <p className="text-xs text-gray-500">Expense date</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(selectedExpense.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="material-icons text-gray-400 text-lg">schedule</span>
                            <div>
                              <p className="text-xs text-gray-500">Submitted on</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(selectedExpense.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {selectedExpense.description && (
                          <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <p className="text-xs font-semibold text-gray-500 mb-2">Description</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{selectedExpense.description}</p>
                          </div>
                        )}
                      </div>

                      {/* Right Side - Receipt */}
                      <div>
                        {selectedExpense.receipt ? (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-4">Receipt</p>
                            <div className="relative">
                              <img 
                                src={selectedExpense.receipt} 
                                alt="Receipt" 
                                className="w-full rounded-lg border border-gray-200 shadow-sm"
                              />
                              <a 
                                href={selectedExpense.receipt} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-md"
                              >
                                <span className="material-icons text-gray-700">open_in_new</span>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center bg-gray-50 rounded-lg p-8">
                            <span className="material-icons text-5xl text-gray-300 mb-3">receipt</span>
                            <p className="text-sm text-gray-500">No receipt attached</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer - Action Buttons */}
                  <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6 flex gap-3">
                    <button
                      onClick={() => setConfirmState({ open: true, expenseId: selectedExpense.id })}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <span className="material-icons">check_circle</span>
                      Approve
                    </button>
                    <button
                      onClick={() => { setRejectReason(''); setShowRejectModal(true); }}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 rounded-lg border-2 border-gray-300 transition-colors disabled:opacity-50"
                    >
                      <span className="material-icons">cancel</span>
                      Reject
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <span className="material-icons text-red-600">cancel</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Reject Expense</h3>
                <p className="text-xs text-gray-500 truncate">{selectedExpense?.title}</p>
              </div>
            </div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
              Reason for Rejection
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Explain why this expense is being rejected…"
              rows={4}
              className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all resize-none mb-5"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={processing}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
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
