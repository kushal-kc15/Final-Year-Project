import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { formatCurrency } from '../utils/currency';

// Consistent color per vendor based on name
const VENDOR_COLORS = [
  '#3B5BDB', '#10b981', '#f97316', '#8b5cf6',
  '#06b6d4', '#ec4899', '#f59e0b', '#ef4444',
  '#84cc16', '#14b8a6',
];
const vendorColor = (name) => VENDOR_COLORS[(name?.charCodeAt(0) || 0) % VENDOR_COLORS.length];

// ── Top vendor featured card ──────────────────────────────────────────────────
function TopVendorCard({ vendor, rank, maxAmount, fmt }) {
  const color = vendorColor(vendor.vendor);
  const pct   = (vendor.total_amount / maxAmount) * 100;
  const avg   = (vendor.total_amount / vendor.transaction_count).toFixed(2);

  const rankStyle = {
    1: { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  label: '🥇 Top Vendor'    },
    2: { bg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-600',  label: '🥈 2nd'           },
    3: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', label: '🥉 3rd'           },
  }[rank] || { bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-500', label: `#${rank}` };

  return (
    <div className={`rounded-2xl border p-6 shadow-card hover:shadow-card-hover transition-all ${rankStyle.bg} ${rankStyle.border}`}>
      {/* Rank label */}
      <div className="flex items-center justify-between mb-5">
        <span className={`text-xs font-bold uppercase tracking-wider ${rankStyle.text}`}>{rankStyle.label}</span>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-700 text-lg"
          style={{ background: color }}
        >
          {vendor.vendor.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Vendor name + amount */}
      <p className="font-display text-lg font-700 text-slate-900 mb-1 truncate">{vendor.vendor}</p>
      <p className="font-display text-3xl font-800 mb-4" style={{ color }}>{fmt(vendor.total_amount)}</p>

      {/* Spend bar */}
      <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>

      {/* Stats row */}
      <div className="flex justify-between text-xs text-slate-500">
        <span>{vendor.transaction_count} transaction{vendor.transaction_count !== 1 ? 's' : ''}</span>
        <span>Avg {fmt(avg)}</span>
      </div>
    </div>
  );
}

// ── Vendor table row ─────────────────────────────────────────────────────────
function VendorRow({ vendor, rank, maxAmount, fmt }) {
  const color = vendorColor(vendor.vendor);
  const pct   = (vendor.total_amount / maxAmount) * 100;
  const avg   = (vendor.total_amount / vendor.transaction_count).toFixed(2);

  return (
    <div className="flex items-center gap-5 py-4 px-6 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
      {/* Rank */}
      <span className="text-sm font-bold text-slate-300 w-6 shrink-0 text-center">{rank}</span>

      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
        style={{ background: color }}
      >
        {vendor.vendor.charAt(0).toUpperCase()}
      </div>

      {/* Name + bar */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 mb-1.5 truncate">{vendor.vendor}</p>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.max(pct, 2)}%`, background: color }}
          />
        </div>
      </div>

      {/* Transactions */}
      <div className="text-center w-20 shrink-0">
        <p className="text-sm font-bold text-slate-700">{vendor.transaction_count}</p>
        <p className="text-[10px] text-slate-400">txns</p>
      </div>

      {/* Avg */}
      <div className="text-right w-28 shrink-0">
        <p className="text-xs text-slate-400">avg</p>
        <p className="text-sm font-semibold text-slate-600">{fmt(avg)}</p>
      </div>

      {/* Total */}
      <div className="text-right w-32 shrink-0">
        <p className="font-display text-base font-700 text-slate-900">{fmt(vendor.total_amount)}</p>
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

  const top3      = sorted.slice(0, 3);
  const rest      = sorted.slice(3);
  const maxAmount = sorted[0]?.total_amount || 1;

  return (
    <div className="flex min-h-screen bg-slate-50 font-body">
      <Sidebar currentPage="vendors" />

      <div className="ml-64 flex-1 flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 h-16 flex items-center justify-between shrink-0">
          <h1 className="font-display text-lg font-700 text-slate-900">Vendors</h1>
          {!loading && vendors.length > 0 && (
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search vendors…"
                  className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl w-48 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                {[
                  { key: 'total', label: 'By Amount'  },
                  { key: 'count', label: 'By Volume'  },
                  { key: 'avg',   label: 'By Average' },
                ].map(s => (
                  <button
                    key={s.key}
                    onClick={() => setSortBy(s.key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      sortBy === s.key
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">

          <div>
            <h2 className="font-display text-2xl font-700 text-slate-900">Vendor Analytics</h2>
            <p className="text-sm text-slate-500 mt-0.5">Track and analyse your spending by vendor.</p>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-5">
            {[
              { label: 'Total Vendors',    value: loading ? '—' : totalVendors,       icon: 'storefront', bg: 'bg-brand-50',  color: 'text-brand-700'  },
              { label: 'Total Spent',      value: loading ? '—' : fmt(totalSpent),     icon: 'payments',   bg: 'bg-violet-50', color: 'text-violet-600' },
              { label: 'Avg per Vendor',   value: loading || !totalVendors ? '—' : fmt(totalSpent / totalVendors), icon: 'bar_chart', bg: 'bg-emerald-50', color: 'text-emerald-600' },
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

          {loading ? (
            <div className="space-y-6">
              {/* Top 3 skeleton */}
              <div className="grid grid-cols-3 gap-5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 h-44 animate-pulse space-y-3">
                    <div className="flex justify-between"><div className="w-20 h-3 bg-slate-100 rounded" /><div className="w-10 h-10 rounded-xl bg-slate-100" /></div>
                    <div className="w-32 h-4 bg-slate-100 rounded" />
                    <div className="w-24 h-7 bg-slate-100 rounded" />
                    <div className="w-full h-1.5 bg-slate-100 rounded-full" />
                  </div>
                ))}
              </div>
              {/* List skeleton */}
              <div className="bg-white rounded-2xl border border-slate-200">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-5 px-6 py-4 border-b border-slate-50 animate-pulse">
                    <div className="w-6 h-3 bg-slate-100 rounded" />
                    <div className="w-9 h-9 rounded-lg bg-slate-100" />
                    <div className="flex-1 space-y-2"><div className="w-36 h-3 bg-slate-100 rounded" /><div className="w-full h-1.5 bg-slate-100 rounded-full" /></div>
                    <div className="w-16 h-3 bg-slate-100 rounded" />
                    <div className="w-20 h-3 bg-slate-100 rounded" />
                    <div className="w-24 h-4 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : sorted.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-card">
              <span className="material-icons text-5xl text-slate-200 mb-4 block">storefront</span>
              <h3 className="font-display font-700 text-slate-900 mb-1">
                {search ? 'No vendors match your search' : 'No vendor data yet'}
              </h3>
              <p className="text-sm text-slate-500">
                {search ? 'Try a different search term.' : 'Add vendor information to expenses to start tracking.'}
              </p>
            </div>
          ) : (
            <>
              {/* ── Top 3 podium ──────────────────────────────────────── */}
              {top3.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Top Vendors</p>
                  <div className={`grid gap-5 ${
                    top3.length === 1 ? 'grid-cols-1 max-w-xs' :
                    top3.length === 2 ? 'grid-cols-2 max-w-xl' :
                    'grid-cols-3'
                  }`}>
                    {top3.map((v, i) => (
                      <TopVendorCard key={v.vendor} vendor={v} rank={i + 1} maxAmount={maxAmount} fmt={fmt} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Full list ─────────────────────────────────────────── */}
              {rest.length > 0 && (
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 h-px bg-slate-200" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">All Vendors</p>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
                    {/* Table header */}
                    <div className="flex items-center gap-5 px-6 py-3 border-b border-slate-100 bg-slate-50">
                      <div className="w-6 shrink-0" />
                      <div className="w-9 shrink-0" />
                      <p className="flex-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Vendor</p>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 w-20 text-center">Transactions</p>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 w-28 text-right">Average</p>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 w-32 text-right">Total Spent</p>
                    </div>
                    {rest.map((v, i) => (
                      <VendorRow key={v.vendor} vendor={v} rank={i + 4} maxAmount={maxAmount} fmt={fmt} />
                    ))}
                  </div>
                </div>
              )}

              {/* If all vendors fit in top 3 */}
              {rest.length === 0 && top3.length > 0 && sorted.length <= 3 && (
                <p className="text-center text-xs text-slate-400 pt-2">
                  {sorted.length} vendor{sorted.length !== 1 ? 's' : ''} total
                </p>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default VendorManagement;