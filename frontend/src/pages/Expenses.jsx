import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AddExpenseModal from '../components/AddExpenseModal';
import Sidebar from '../components/Sidebar';
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
    <div className="flex min-h-screen bg-slate-50 font-body">
      <Sidebar currentPage="expenses" />

      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 h-16 flex items-center justify-between shrink-0">
          <h1 className="font-display text-lg font-700 text-slate-900">Expenses</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <span className="material-icons text-[18px]">add</span>
            New Expense
          </button>
        </header>

        {/* Split body */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Left panel ──────────────────────────────────────────────── */}
          <aside className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-y-auto">

            {/* Summary */}
            <div className="p-6 border-b border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Summary</p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Total on this page</p>
                  <p className="font-display text-2xl font-700 text-slate-900">{fmt(totalAmt)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1">Pending</p>
                    <p className="font-display text-xl font-700 text-amber-700">{loading ? '—' : pendingCnt}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">Approved</p>
                    <p className="font-display text-xl font-700 text-emerald-700">{loading ? '—' : approvedCnt}</p>
                  </div>
                </div>
                <div className="pt-1">
                  <p className="text-xs text-slate-400">{loading ? '—' : totalCount} total expense{totalCount !== 1 ? 's' : ''} found</p>
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
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search expenses…"
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all"
                />
              </div>
            </div>

            {/* Status filter */}
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Status</p>
              <div className="space-y-1">
                {FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => { setFilterStatus(f.key); setCurrentPage(1); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      filterStatus === f.key
                        ? 'bg-brand-700 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{f.label}</span>
                    {filterStatus === f.key && <span className="material-icons text-sm">check</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter */}
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Category</p>
              <div className="space-y-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setFilterCat(cat); setCurrentPage(1); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      filterCat === cat
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat !== 'ALL' && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: filterCat === cat ? 'white' : CAT_COLOR[cat] }}
                      />
                    )}
                    <span>{cat === 'ALL' ? 'All Categories' : CAT_LABEL[cat]}</span>
                  </button>
                ))}
              </div>
            </div>

          </aside>

          {/* ── Right panel — Ledger ─────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 space-y-6">
                {[...Array(3)].map((_, g) => (
                  <div key={g}>
                    <div className="w-40 h-3 bg-slate-200 rounded animate-pulse mb-3" />
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 animate-pulse">
                          <div className="w-1 h-12 rounded-full bg-slate-200 shrink-0" />
                          <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="w-48 h-3.5 bg-slate-100 rounded" />
                            <div className="w-28 h-2.5 bg-slate-100 rounded" />
                          </div>
                          <div className="w-24 h-5 bg-slate-100 rounded" />
                          <div className="w-20 h-6 bg-slate-100 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-24">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <span className="material-icons text-3xl text-slate-300">receipt_long</span>
                </div>
                <div className="text-center">
                  <p className="font-display font-700 text-slate-900 mb-1">No expenses found</p>
                  <p className="text-sm text-slate-500">Try adjusting your filters or add a new expense.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-800 transition-colors"
                >
                  <span className="material-icons text-[18px]">add</span>
                  New Expense
                </button>
              </div>
            ) : (
              <div className="p-8 space-y-8">
                {Object.entries(grouped).map(([date, items]) => (
                  <div key={date}>
                    {/* Date group header */}
                    <div className="flex items-center gap-3 mb-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{date}</p>
                      <div className="flex-1 h-px bg-slate-100" />
                      <p className="text-xs font-bold text-slate-500">
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
                            className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-card transition-all flex items-center gap-4 px-4 py-3.5 group"
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
                              <span className="material-icons text-[18px]" style={{ color }}>receipt</span>
                            </div>

                            {/* Title + meta */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{exp.title}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[11px] font-medium text-slate-400">
                                  {CAT_LABEL[exp.category] || exp.category}
                                </span>
                                {exp.user_details && (
                                  <>
                                    <span className="text-slate-200">·</span>
                                    <span className="text-[11px] text-slate-400">{exp.user_details.username}</span>
                                  </>
                                )}
                                {exp.description && (
                                  <>
                                    <span className="text-slate-200">·</span>
                                    <span className="text-[11px] text-slate-400 truncate max-w-[200px]">{exp.description}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Amount */}
                            <p className="font-display text-lg font-700 text-slate-900 shrink-0 w-32 text-right">
                              {fmt(exp.amount)}
                            </p>

                            {/* Status */}
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold shrink-0 ${sc.bg} ${sc.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">
                    Showing {expenses.length} of {totalCount} expenses
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={expenses.length < 20}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>

        </div>
      </div>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchExpenses}
      />
    </div>
  );
}

export default Expenses;