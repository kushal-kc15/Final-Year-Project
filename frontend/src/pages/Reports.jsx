import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { formatCurrency } from '../utils/currency';

const CAT_COLORS = [
  '#3B5BDB', '#10b981', '#f97316', '#8b5cf6',
  '#06b6d4', '#ec4899', '#f59e0b', '#94a3b8',
];

export default function Reports() {
  const navigate = useNavigate();
  const { user, loading: authLoading, currency } = useAuth();
  
  const fmt = (amount) => formatCurrency(amount, currency);

  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]        = useState(false);
  const [spendingTrends,   setSpendingTrends]    = useState([]);
  const [categoryBreakdown,setCategoryBreakdown] = useState([]);
  const [periodComparison, setPeriodComparison]  = useState(null);
  const [period,           setPeriod]            = useState('daily');
  const [dateRange,        setDateRange]         = useState('month');

  const fetchAnalytics = useCallback(async () => {
    try {
      setRefreshing(true);
      const [trendsRes, categoryRes, comparisonRes] = await Promise.all([
        api.get(`/analytics/spending-trends/?period=${period}`),
        api.get('/analytics/category-breakdown/'),
        api.get(`/analytics/period-comparison/?period_type=${dateRange}`),
      ]);
      setSpendingTrends(trendsRes.data.trends || []);
      setCategoryBreakdown(categoryRes.data.breakdown || []);
      setPeriodComparison(comparisonRes.data);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setRefreshing(false);
    }
  }, [period, dateRange]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    fetchAnalytics().finally(() => setLoading(false));
  }, [user, authLoading, navigate, fetchAnalytics]);

  const maxTrend = spendingTrends.length > 0
    ? Math.max(...spendingTrends.map(t => t.total), 1)
    : 1;

  const changeUp = periodComparison?.change_percentage >= 0;

  return (
    <div className="flex min-h-screen bg-slate-50 font-body">
      <Sidebar currentPage="reports" />

      <div className="ml-64 flex-1 flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 h-16 flex items-center justify-between shrink-0">
          <h1 className="font-display text-lg font-700 text-slate-900">Reports</h1>

          <div className="flex items-center gap-4">
            {/* Period selector */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {['daily', 'weekly', 'monthly'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  disabled={refreshing}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                    period === p
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Date range */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {[
                { key: 'week', label: 'Week' },
                { key: 'month', label: 'Month' },
                { key: 'year', label: 'Year' },
              ].map(d => (
                <button
                  key={d.key}
                  onClick={() => setDateRange(d.key)}
                  disabled={refreshing}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    dateRange === d.key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {refreshing && (
              <div className="w-4 h-4 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
            )}
          </div>
        </header>

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">

          {/* Page title */}
          <div>
            <h2 className="font-display text-2xl font-700 text-slate-900">Financial Reports</h2>
            <p className="text-sm text-slate-500 mt-0.5">Understand your spending patterns over time.</p>
          </div>

          {/* ── Period comparison ─────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 h-32 animate-pulse">
                  <div className="w-24 h-3 bg-slate-100 rounded mb-4" />
                  <div className="w-36 h-8 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : periodComparison && (
            <div className="grid grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Current {dateRange}</p>
                <p className="font-display text-3xl font-800 text-slate-900 mb-1">
                  {fmt(periodComparison.current_period.total)}
                </p>
                <p className="text-sm text-slate-500">{periodComparison.current_period.count} transactions</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Previous {dateRange}</p>
                <p className="font-display text-3xl font-800 text-slate-700 mb-1">
                  {fmt(periodComparison.previous_period.total)}
                </p>
                <p className="text-sm text-slate-500">{periodComparison.previous_period.count} transactions</p>
              </div>

              <div className={`rounded-2xl border p-6 shadow-card ${changeUp ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Change</p>
                <div className="flex items-baseline gap-2">
                  <p className={`font-display text-3xl font-800 ${changeUp ? 'text-red-600' : 'text-emerald-600'}`}>
                    {changeUp ? '+' : ''}{periodComparison.change_percentage}%
                  </p>
                  <span className={`material-icons text-lg ${changeUp ? 'text-red-400' : 'text-emerald-400'}`}>
                    {changeUp ? 'trending_up' : 'trending_down'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">vs previous {dateRange}</p>
              </div>
            </div>
          )}

          {/* ── Spending trend ────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-7">
            <div className="flex items-center justify-between mb-7">
              <div>
                <h3 className="font-display font-700 text-slate-900 text-lg">Spending Trend</h3>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">{period} view</p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4">
                    <div className="w-16 h-3 bg-slate-100 rounded shrink-0" />
                    <div className="flex-1 h-8 bg-slate-100 rounded-lg" style={{ width: `${40 + Math.random() * 50}%` }} />
                    <div className="w-20 h-3 bg-slate-100 rounded shrink-0" />
                  </div>
                ))}
              </div>
            ) : spendingTrends.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center gap-2">
                <span className="material-icons text-4xl text-slate-200">show_chart</span>
                <p className="text-sm text-slate-400">No data for this period</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {spendingTrends.map((trend, i) => {
                  const pct     = (trend.total / maxTrend) * 100;
                  const dateStr = new Date(trend.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <div key={i} className="flex items-center gap-4 group">
                      <p className="text-xs font-medium text-slate-400 w-16 shrink-0 text-right">{dateStr}</p>
                      <div className="flex-1 h-9 bg-slate-50 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-3"
                          style={{
                            width: `${Math.max(pct, 3)}%`,
                            background: `linear-gradient(90deg, #3B5BDB22, #3B5BDB)`,
                          }}
                        >
                          {pct > 20 && (
                            <span className="text-white text-xs font-bold">{trend.count}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-700 w-28 shrink-0 text-right">{fmt(trend.total)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Category breakdown ────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Category bars — spans 3 cols */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-card p-7">
              <h3 className="font-display font-700 text-slate-900 text-lg mb-6">Spending by Category</h3>

              {loading ? (
                <div className="space-y-5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-1.5">
                      <div className="flex justify-between">
                        <div className="w-28 h-3 bg-slate-100 rounded" />
                        <div className="w-12 h-3 bg-slate-100 rounded" />
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : categoryBreakdown.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center gap-2">
                  <span className="material-icons text-4xl text-slate-200">pie_chart</span>
                  <p className="text-sm text-slate-400">No category data yet</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {categoryBreakdown.map((cat, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: CAT_COLORS[i % CAT_COLORS.length] }}
                          />
                          <span className="text-sm font-semibold text-slate-700">{cat.category}</span>
                          <span className="text-xs text-slate-400">{cat.count} txns</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-900">{fmt(cat.total)}</span>
                          <span className="text-xs text-slate-400 ml-2">{cat.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max(cat.percentage, 1)}%`,
                            background: CAT_COLORS[i % CAT_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Insights panel — spans 2 cols */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Top category highlight */}
              {!loading && categoryBreakdown.length > 0 && (
                <div
                  className="rounded-2xl p-6 flex-1"
                  style={{ background: `${CAT_COLORS[0]}10`, border: `1px solid ${CAT_COLORS[0]}30` }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: CAT_COLORS[0] }}>
                    Top Category
                  </p>
                  <p className="font-display text-2xl font-800 text-slate-900 mb-1">
                    {categoryBreakdown[0]?.category}
                  </p>
                  <p className="font-display text-3xl font-800 mb-2" style={{ color: CAT_COLORS[0] }}>
                    {fmt(categoryBreakdown[0]?.total)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {categoryBreakdown[0]?.percentage}% of total · {categoryBreakdown[0]?.count} transactions
                  </p>
                </div>
              )}

              {/* Trend summary */}
              {!loading && periodComparison && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Quick Summary
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Categories</span>
                      <span className="text-sm font-bold text-slate-900">{categoryBreakdown.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">This {dateRange}</span>
                      <span className="text-sm font-bold text-slate-900">{fmt(periodComparison.current_period.total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Transactions</span>
                      <span className="text-sm font-bold text-slate-900">{periodComparison.current_period.count}</span>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">vs last {dateRange}</span>
                      <span className={`text-sm font-bold ${changeUp ? 'text-red-600' : 'text-emerald-600'}`}>
                        {changeUp ? '↑' : '↓'} {Math.abs(periodComparison.change_percentage)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading skeleton for insights */}
              {loading && (
                <>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 flex-1 animate-pulse">
                    <div className="w-24 h-3 bg-slate-100 rounded mb-4" />
                    <div className="w-32 h-6 bg-slate-100 rounded mb-2" />
                    <div className="w-28 h-8 bg-slate-100 rounded" />
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="w-20 h-3 bg-slate-100 rounded" />
                        <div className="w-16 h-3 bg-slate-100 rounded" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}