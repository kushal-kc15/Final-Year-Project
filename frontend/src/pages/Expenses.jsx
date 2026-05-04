import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AddExpenseModal from '../components/AddExpenseModal';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import ProfileDropdown from '../components/ProfileDropdown';
import { formatCurrency } from '../utils/currency';

const CAT_COLOR = {
  FOOD:      '#f97316',
  TRANSPORT: '#3b82f6',
  OFFICE:    '#8b5cf6',
  UTILITIES: '#06b6d4',
  SALARY:    '#10b981',
  RENT:      '#ec4899',
  MARKETING: '#f59e0b',
  OTHER:     '#94a3b8',
};

const CAT_LABEL = {
  FOOD: 'Food & Dining', TRANSPORT: 'Transport', OFFICE: 'Office Supplies',
  UTILITIES: 'Utilities', SALARY: 'Salary & Wages', RENT: 'Rent',
  MARKETING: 'Marketing', OTHER: 'Other',
};

const STATUS_CONFIG = {
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  PENDING:  { label: 'Pending',  bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  REJECTED: { label: 'Rejected', bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400'     },
};

const FILTERS = [
  { key: 'all',      label: 'All'      },
  { key: 'pending',  label: 'Pending'  },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const CATEGORIES = ['ALL', 'FOOD', 'TRANSPORT', 'OFFICE', 'UTILITIES', 'SALARY', 'RENT', 'MARKETING', 'OTHER'];

function Expenses() {
  const navigate = useNavigate();
  const { currency } = useAuth();
  const [expenses,     setExpenses]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCat,    setFilterCat]    = useState('ALL');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseDetails, setExpenseDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fmt = (amount) => formatCurrency(amount, currency);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, search: searchQuery };
      if (filterStatus !== 'all') params.status = filterStatus.toUpperCase();
      if (filterCat !== 'ALL') params.category = filterCat;

      const res = await api.get('/expenses/', { params });
      if (res.data.results) {
        setExpenses(res.data.results);
        setTotalCount(res.data.count || 0);
      } else {
        const list = Array.isArray(res.data) ? res.data : [];
        setExpenses(list);
        setTotalCount(list.length);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate('/login');
      setExpenses([]); setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterStatus, filterCat, currentPage, navigate]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const fetchExpenseDetails = async (expenseId) => {
    try {
      setLoadingDetails(true);
      const response = await api.get(`/expenses/${expenseId}/`);
      setExpenseDetails(response.data);
    } catch (error) {
      console.error('Error fetching expense details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExpenseClick = (expense) => {
    setSelectedExpense(expense);
    fetchExpenseDetails(expense.id);
  };

  const closeDetailModal = () => {
    setSelectedExpense(null);
    setExpenseDetails(null);
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus.toUpperCase());
      if (filterCat !== 'ALL') params.append('category', filterCat);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await api.get(`/expenses/export_csv/?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export expenses. Please try again.');
    }
  };

  // Summary stats from current page data
  const totalAmt    = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const pendingCnt  = expenses.filter(e => e.status === 'PENDING').length;
  const approvedCnt = expenses.filter(e => e.status === 'APPROVED').length;

  // Group expenses by date for the ledger
  const grouped = expenses.reduce((acc, exp) => {
    const date = new Date(exp.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(exp);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen bg-gray-50 font-body" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      <Sidebar currentPage="expenses" />

      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 h-20 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track and manage all your expenses</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
            >
              <span className="material-icons text-lg">download</span>
              Export CSV
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/30"
            >
              <span className="material-icons text-lg">add</span>
              New Expense
            </button>
            <NotificationBell />
            <div className="w-px h-8 bg-gray-200" />
            <ProfileDropdown />
          </div>
        </header>

        {/* Summary Cards */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Total on Page</p>
              <p className="text-2xl font-bold text-blue-900">{fmt(totalAmt)}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Pending</p>
              <p className="text-2xl font-bold text-amber-900">{loading ? '—' : pendingCnt}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Approved</p>
              <p className="text-2xl font-bold text-emerald-900">{loading ? '—' : approvedCnt}</p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Total Found</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : totalCount}</p>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search expenses..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status:</span>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => { setFilterStatus(f.key); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      filterStatus === f.key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category:</span>
              <select
                value={filterCat}
                onChange={e => { setFilterCat(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 text-sm font-medium bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'ALL' ? 'All Categories' : CAT_LABEL[cat]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, g) => (
                <div key={g}>
                  <div className="w-40 h-3 bg-gray-200 rounded animate-pulse mb-3" />
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 animate-pulse">
                        <div className="w-1 h-12 rounded-full bg-gray-200 shrink-0" />
                        <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="w-48 h-3.5 bg-gray-100 rounded" />
                          <div className="w-28 h-2.5 bg-gray-100 rounded" />
                        </div>
                        <div className="w-24 h-5 bg-gray-100 rounded" />
                        <div className="w-20 h-6 bg-gray-100 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-24">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <span className="material-icons text-3xl text-gray-300">receipt_long</span>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 mb-1">No expenses found</p>
                <p className="text-sm text-gray-500">Try adjusting your filters or add a new expense.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="material-icons text-lg">add</span>
                New Expense
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([date, items]) => (
                <div key={date}>
                  {/* Date group header */}
                  <div className="flex items-center gap-3 mb-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{date}</p>
                    <div className="flex-1 h-px bg-gray-200" />
                    <p className="text-xs font-bold text-gray-600">
                      {fmt(items.reduce((s, e) => s + parseFloat(e.amount || 0), 0))}
                    </p>
                  </div>

                  {/* Expense rows */}
                  <div className="space-y-2">
                    {items.map(exp => {
                      const sc = STATUS_CONFIG[exp.status] || STATUS_CONFIG.PENDING;
                      const color = CAT_COLOR[exp.category] || CAT_COLOR.OTHER;
                      return (
                        <div
                          key={exp.id}
                          onClick={() => handleExpenseClick(exp)}
                          className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all flex items-center gap-4 px-4 py-3.5 group cursor-pointer"
                        >
                          {/* Category accent bar */}
                          <div
                            className="w-1 h-10 rounded-full shrink-0"
                            style={{ background: color }}
                          />

                          {/* Category icon */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${color}18` }}
                          >
                            <span className="material-icons text-lg" style={{ color }}>receipt</span>
                          </div>

                          {/* Title + category */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{exp.title}</p>
                            <p className="text-xs font-medium text-gray-400 mt-0.5">
                              {CAT_LABEL[exp.category] || exp.category}
                            </p>
                          </div>

                          {/* Amount */}
                          <p className="text-lg font-bold text-gray-900 shrink-0 w-32 text-right">
                            {fmt(exp.amount)}
                          </p>

                          {/* Status */}
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </div>

                          {/* View icon */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <span className="material-icons text-gray-400">chevron_right</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalCount > 20 && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} expenses
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="w-9 h-9 flex items-center justify-center text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-icons text-sm">first_page</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-9 h-9 flex items-center justify-center text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-icons text-sm">chevron_left</span>
                    </button>
                    
                    {/* Page numbers */}
                    {(() => {
                      const totalPages = Math.ceil(totalCount / 20);
                      const pages = [];
                      const showPages = 5;
                      let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                      let endPage = Math.min(totalPages, startPage + showPages - 1);
                      
                      if (endPage - startPage < showPages - 1) {
                        startPage = Math.max(1, endPage - showPages + 1);
                      }
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`w-9 h-9 flex items-center justify-center text-sm font-semibold rounded-lg transition-colors ${
                              currentPage === i
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      return pages;
                    })()}
                    
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage >= Math.ceil(totalCount / 20)}
                      className="w-9 h-9 flex items-center justify-center text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-icons text-sm">chevron_right</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.ceil(totalCount / 20))}
                      disabled={currentPage >= Math.ceil(totalCount / 20)}
                      className="w-9 h-9 flex items-center justify-center text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-icons text-sm">last_page</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchExpenses}
      />

      {/* Expense Detail Modal */}
      {selectedExpense && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={closeDetailModal}
        >
          <div 
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Expense Details</h3>
                <p className="text-sm text-gray-500 mt-0.5">#{selectedExpense.id}</p>
              </div>
              <button
                onClick={closeDetailModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-gray-500">Loading details...</p>
                  </div>
                </div>
              ) : expenseDetails ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Details */}
                  <div className="space-y-4">
                    {/* Status */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Status</p>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${STATUS_CONFIG[expenseDetails.status]?.bg} ${STATUS_CONFIG[expenseDetails.status]?.text}`}>
                        <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[expenseDetails.status]?.dot}`} />
                        {STATUS_CONFIG[expenseDetails.status]?.label}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Title</p>
                      <p className="text-lg font-semibold text-gray-900">{expenseDetails.title}</p>
                    </div>

                    {/* Amount */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Amount</p>
                      <p className="text-3xl font-bold text-blue-600">{fmt(expenseDetails.amount)}</p>
                    </div>

                    {/* Category & Date */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Category</p>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: `${CAT_COLOR[expenseDetails.category]}18` }}
                          >
                            <span className="material-icons text-sm" style={{ color: CAT_COLOR[expenseDetails.category] }}>
                              receipt
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {CAT_LABEL[expenseDetails.category] || expenseDetails.category}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Date</p>
                        <p className="text-sm text-gray-900">
                          {new Date(expenseDetails.date).toLocaleDateString('en-US', { 
                            month: 'long', day: 'numeric', year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Vendor */}
                    {expenseDetails.vendor && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Vendor</p>
                        <p className="text-sm text-gray-900">{expenseDetails.vendor}</p>
                      </div>
                    )}

                    {/* Submitted By */}
                    {expenseDetails.user_details && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Submitted By</p>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                            {expenseDetails.user_details.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{expenseDetails.user_details.username}</p>
                            <p className="text-xs text-gray-500">{expenseDetails.user_details.email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {expenseDetails.description && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Description</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{expenseDetails.description}</p>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                        <div>
                          <p className="font-semibold mb-1">Created</p>
                          <p>{new Date(expenseDetails.created_at).toLocaleString('en-US', { 
                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}</p>
                        </div>
                        <div>
                          <p className="font-semibold mb-1">Last Updated</p>
                          <p>{new Date(expenseDetails.updated_at).toLocaleString('en-US', { 
                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Receipt */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Receipt</p>
                    {expenseDetails.receipt_url ? (
                      <div className="space-y-3">
                        <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={expenseDetails.receipt_url}
                            alt="Receipt"
                            className="w-full h-auto"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(expenseDetails.receipt_url, '_blank')}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                          >
                            <span className="material-icons text-lg">open_in_new</span>
                            View Full Size
                          </button>
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = expenseDetails.receipt_url;
                              link.download = `receipt-${expenseDetails.id}.jpg`;
                              link.click();
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          >
                            <span className="material-icons text-lg">download</span>
                            Download
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                        <span className="material-icons text-5xl text-gray-300 mb-3 block">receipt_long</span>
                        <p className="text-sm font-medium text-gray-900 mb-1">No receipt attached</p>
                        <p className="text-xs text-gray-500">This expense was submitted without a receipt</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-sm text-gray-500">Failed to load expense details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Expenses;
