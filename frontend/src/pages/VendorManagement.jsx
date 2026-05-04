import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import ProfileDropdown from '../components/ProfileDropdown';
import { formatCurrency } from '../utils/currency';

// Subtle color palette per vendor
const VENDOR_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' },
  { bg: 'bg-purple-100', text: 'text-purple-700', bar: 'bg-purple-500' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500' },
  { bg: 'bg-pink-100', text: 'text-pink-700', bar: 'bg-pink-500' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', bar: 'bg-cyan-500' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', bar: 'bg-indigo-500' },
  { bg: 'bg-teal-100', text: 'text-teal-700', bar: 'bg-teal-500' },
];

const vendorColor = (name) => VENDOR_COLORS[(name?.charCodeAt(0) || 0) % VENDOR_COLORS.length];

// ── Vendor Card ──────────────────────────────────────────────────────────────
function VendorCard({ vendor, rank, maxAmount, fmt, onViewDetails }) {
  const colors = vendorColor(vendor.vendor);
  const pct   = (vendor.total_amount / maxAmount) * 100;
  const avg   = (vendor.total_amount / vendor.transaction_count).toFixed(2);

  // Determine rank badge style
  const getRankBadge = () => {
    if (rank === 1) return { bg: 'bg-gradient-to-br from-yellow-400 to-amber-500', text: 'text-white', icon: '🏆' };
    if (rank === 2) return { bg: 'bg-gradient-to-br from-gray-300 to-gray-400', text: 'text-white', icon: '🥈' };
    if (rank === 3) return { bg: 'bg-gradient-to-br from-amber-600 to-amber-700', text: 'text-white', icon: '🥉' };
    return { bg: 'bg-gray-100', text: 'text-gray-600', icon: null };
  };

  const rankBadge = getRankBadge();

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl hover:shadow-xl transition-all shadow-md hover:border-gray-300 overflow-hidden group">
      {/* Top colored strip */}
      <div className={`h-1.5 ${colors.bar}`} />
      
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          {/* Rank Badge */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${rankBadge.bg} ${rankBadge.text} shadow-sm`}>
            {rankBadge.icon || `#${rank}`}
          </div>

          {/* Vendor Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900 truncate">{vendor.vendor}</h3>
              {rank <= 3 && (
                <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  TOP {rank}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {vendor.transaction_count} transaction{vendor.transaction_count !== 1 ? 's' : ''} • Avg {fmt(avg)}
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={() => onViewDetails(vendor)}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <span className="material-icons text-lg">more_vert</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">Spending Share</span>
            <span className="text-xs font-bold text-gray-900">{pct.toFixed(1)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-inner">
            <div
              className={`h-full ${colors.bar} rounded-full transition-all duration-700 relative`}
              style={{ width: `${Math.max(pct, 2)}%` }}
            >
              <div className="absolute inset-0 bg-white/20" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="material-icons text-gray-400 text-xs">receipt_long</span>
              <p className="text-xs text-gray-500 font-semibold">Transactions</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{vendor.transaction_count}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="material-icons text-gray-400 text-xs">trending_up</span>
              <p className="text-xs text-gray-500 font-semibold">Average</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{fmt(avg)}</p>
          </div>

          <div className={`${colors.bg} rounded-lg p-3 border-2 ${colors.bg.replace('100', '200')}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`material-icons text-xs ${colors.text}`}>payments</span>
              <p className={`text-xs font-semibold ${colors.text}`}>Total</p>
            </div>
            <p className={`text-lg font-bold ${colors.text}`}>{fmt(vendor.total_amount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
function VendorManagement() {
  const navigate = useNavigate();
  const { user, loading: authLoading, currency } = useAuth();
  
  const fmt = (amount) => formatCurrency(amount, currency);

  const [vendors,      setVendors]      = useState([]);
  const [totalVendors, setTotalVendors] = useState(0);
  const [totalSpent,   setTotalSpent]   = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [sortBy,       setSortBy]       = useState('total'); // 'total' | 'count' | 'avg'
  const [viewMode,     setViewMode]     = useState('grid'); // 'grid' | 'list'
  const [currentPage,  setCurrentPage]  = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 9 : 10;

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    fetchVendorAnalytics().finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  const fetchVendorAnalytics = async () => {
    try {
      const res = await api.get('/expenses/vendor_analytics/');
      setVendors(res.data.vendors || []);
      setTotalVendors(res.data.total_vendors || 0);
      setTotalSpent(res.data.total_spent || 0);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate('/login');
    }
  };

  // Sort + filter
  const sorted = [...vendors]
    .filter(v => v.vendor.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'total') return b.total_amount - a.total_amount;
      if (sortBy === 'count') return b.transaction_count - a.transaction_count;
      if (sortBy === 'avg')   return (b.total_amount / b.transaction_count) - (a.total_amount / a.transaction_count);
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVendors = sorted.slice(startIndex, endIndex);
  const maxAmount = sorted[0]?.total_amount || 1;

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleViewDetails = (vendor) => {
    // Placeholder for future vendor details modal/page
    console.log('View details for:', vendor);
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
      <Sidebar currentPage="vendors" />

      <div className="ml-64 flex-1 flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 h-20 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track and analyze spending by vendor</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="w-px h-8 bg-gray-200" />
            <ProfileDropdown />
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { 
                label: 'Total Vendors', 
                value: loading ? '—' : totalVendors, 
                icon: 'storefront', 
                gradient: 'from-blue-500 to-blue-600',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600'
              },
              { 
                label: 'Total Spent', 
                value: loading ? '—' : fmt(totalSpent), 
                icon: 'payments', 
                gradient: 'from-purple-500 to-purple-600',
                iconBg: 'bg-purple-100',
                iconColor: 'text-purple-600'
              },
              { 
                label: 'Avg per Vendor', 
                value: loading || !totalVendors ? '—' : fmt(totalSpent / totalVendors), 
                icon: 'bar_chart', 
                gradient: 'from-emerald-500 to-emerald-600',
                iconBg: 'bg-emerald-100',
                iconColor: 'text-emerald-600'
              },
              { 
                label: 'Top Vendor', 
                value: loading || !vendors.length ? '—' : vendors[0]?.vendor, 
                icon: 'emoji_events', 
                gradient: 'from-amber-500 to-amber-600',
                iconBg: 'bg-amber-100',
                iconColor: 'text-amber-600'
              },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                    <span className={`material-icons text-lg ${stat.iconColor}`}>{stat.icon}</span>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{stat.label}</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 truncate">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Controls Bar */}
          {!loading && vendors.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Search */}
                <div className="relative flex-1 max-w-md">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                  <input
                    type="text"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    placeholder="Search vendors…"
                    className="pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Middle: Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 mr-1">Sort:</span>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    {[
                      { key: 'total', label: 'Amount', icon: 'payments' },
                      { key: 'count', label: 'Volume', icon: 'receipt_long' },
                      { key: 'avg',   label: 'Average', icon: 'trending_up' },
                    ].map(s => (
                      <button
                        key={s.key}
                        onClick={() => { setSortBy(s.key); setCurrentPage(1); }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                          sortBy === s.key
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <span className="material-icons text-sm">{s.icon}</span>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: View Mode */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => { setViewMode('grid'); setCurrentPage(1); }}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Grid view"
                  >
                    <span className="material-icons text-lg">grid_view</span>
                  </button>
                  <button
                    onClick={() => { setViewMode('list'); setCurrentPage(1); }}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="List view"
                  >
                    <span className="material-icons text-lg">view_list</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}>
              {[...Array(viewMode === 'grid' ? 6 : 5)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="w-32 h-4 bg-gray-100 rounded" />
                      <div className="w-24 h-3 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full mb-4" />
                  <div className="grid grid-cols-3 gap-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-16 bg-gray-100 rounded-lg" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
              <span className="material-icons text-6xl text-gray-200 mb-4 block">storefront</span>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">
                {search ? 'No vendors match your search' : 'No vendor data yet'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {search ? 'Try a different search term.' : 'Add vendor information to expenses to start tracking.'}
              </p>
              {!search && (
                <button
                  onClick={() => navigate('/expenses')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <span className="material-icons text-sm">add</span>
                  Add Expense
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Vendor Grid/List */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {currentVendors.map((v, i) => (
                    <VendorCard 
                      key={v.vendor} 
                      vendor={v} 
                      rank={startIndex + i + 1} 
                      maxAmount={maxAmount} 
                      fmt={fmt}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {currentVendors.map((v, i) => {
                    const colors = vendorColor(v.vendor);
                    const pct = (v.total_amount / maxAmount) * 100;
                    const avg = (v.total_amount / v.transaction_count).toFixed(2);
                    const rank = startIndex + i + 1;

                    return (
                      <div key={v.vendor} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all shadow-sm hover:border-gray-300">
                        <div className="flex items-center gap-5">
                          {/* Rank */}
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-sm text-gray-600 shrink-0">
                            #{rank}
                          </div>

                          {/* Avatar */}
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 ${colors.bg} ${colors.text}`}>
                            {v.vendor.charAt(0).toUpperCase()}
                          </div>

                          {/* Name + Progress */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-base font-bold text-gray-900 truncate">{v.vendor}</p>
                              {rank <= 3 && (
                                <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                  TOP {rank}
                                </span>
                              )}
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                              <div
                                className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
                                style={{ width: `${Math.max(pct, 2)}%` }}
                              />
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-center min-w-[90px]">
                              <p className="text-xs text-gray-500 mb-0.5">Transactions</p>
                              <p className="text-base font-bold text-gray-900">{v.transaction_count}</p>
                            </div>

                            <div className="text-center min-w-[100px]">
                              <p className="text-xs text-gray-500 mb-0.5">Average</p>
                              <p className="text-base font-bold text-gray-900">{fmt(avg)}</p>
                            </div>

                            <div className="text-right min-w-[130px]">
                              <p className="text-xs text-gray-500 mb-0.5">Total Spent</p>
                              <p className={`text-xl font-bold ${colors.text}`}>{fmt(v.total_amount)}</p>
                            </div>

                            <button
                              onClick={() => handleViewDetails(v)}
                              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <span className="material-icons text-lg">more_vert</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-6 py-4 shadow-sm">
                  <p className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, sorted.length)} of {sorted.length} vendors
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
            </>
          )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorManagement;