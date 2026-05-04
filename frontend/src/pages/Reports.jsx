import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import ProfileDropdown from '../components/ProfileDropdown';
import { formatCurrency } from '../utils/currency';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(59, 91, 219);
    doc.text('Vyapar Margadarshan', 14, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Financial Report', 14, 30);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    const periodLabel = period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly';
    const rangeLabel = dateRange === 'week' ? 'Week' : dateRange === 'month' ? 'Month' : 'Year';
    doc.text(`Report Type: ${periodLabel} | Period: ${rangeLabel}`, 14, 37);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 43);
    
    let yPosition = 55;
    
    // Helper function to format currency for PDF (removes special characters)
    const formatForPDF = (amount) => {
      return `${currency} ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    
    // Period Comparison
    if (periodComparison) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Period Comparison', 14, yPosition);
      
      autoTable(doc, {
        startY: yPosition + 5,
        head: [['Period', 'Total', 'Transactions', 'Change']],
        body: [
          [
            `Current ${dateRange}`,
            formatForPDF(periodComparison.current_period.total),
            periodComparison.current_period.count,
            '-'
          ],
          [
            `Previous ${dateRange}`,
            formatForPDF(periodComparison.previous_period.total),
            periodComparison.previous_period.count,
            `${periodComparison.change_percentage}%`
          ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 91, 219] }
      });
      
      yPosition = doc.lastAutoTable.finalY + 15;
    }
    
    // Category Breakdown
    if (categoryBreakdown.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Category Breakdown', 14, yPosition);
      
      autoTable(doc, {
        startY: yPosition + 5,
        head: [['Category', 'Amount', 'Transactions', 'Percentage']],
        body: categoryBreakdown.map(cat => [
          cat.category,
          formatForPDF(cat.total),
          cat.count,
          `${cat.percentage}%`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 91, 219] }
      });
      
      yPosition = doc.lastAutoTable.finalY + 15;
    }
    
    // Spending Trends
    if (spendingTrends.length > 0 && yPosition < 250) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Spending Trend (${periodLabel})`, 14, yPosition);
      
      autoTable(doc, {
        startY: yPosition + 5,
        head: [['Date', 'Amount', 'Transactions']],
        body: spendingTrends.slice(0, 10).map(trend => [
          new Date(trend.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          formatForPDF(trend.total),
          trend.count
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 91, 219] }
      });
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    
    // Save PDF with descriptive filename
    const filename = `financial-report-${periodLabel.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  // Export to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Period Comparison Sheet
    if (periodComparison) {
      const comparisonData = [
        ['Period Comparison'],
        [],
        ['Period', 'Total', 'Transactions', 'Change'],
        [
          `Current ${dateRange}`,
          periodComparison.current_period.total,
          periodComparison.current_period.count,
          '-'
        ],
        [
          `Previous ${dateRange}`,
          periodComparison.previous_period.total,
          periodComparison.previous_period.count,
          `${periodComparison.change_percentage}%`
        ]
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(comparisonData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Period Comparison');
    }
    
    // Category Breakdown Sheet
    if (categoryBreakdown.length > 0) {
      const categoryData = [
        ['Category Breakdown'],
        [],
        ['Category', 'Amount', 'Transactions', 'Percentage'],
        ...categoryBreakdown.map(cat => [
          cat.category,
          cat.total,
          cat.count,
          cat.percentage
        ])
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Categories');
    }
    
    // Spending Trends Sheet
    if (spendingTrends.length > 0) {
      const trendsData = [
        [`Spending Trend (${period})`],
        [],
        ['Date', 'Amount', 'Transactions'],
        ...spendingTrends.map(trend => [
          new Date(trend.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          trend.total,
          trend.count
        ])
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(trendsData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Spending Trends');
    }
    
    // Save Excel
    XLSX.writeFile(wb, `financial-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-body" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      <Sidebar currentPage="reports" />

      <div className="ml-64 flex-1 flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 h-20 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">Understand your spending patterns over time</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Export buttons */}
            {!loading && (spendingTrends.length > 0 || categoryBreakdown.length > 0) && (
              <div className="flex items-center gap-2">
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <span className="material-icons text-lg">picture_as_pdf</span>
                  Export PDF
                </button>
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <span className="material-icons text-lg">table_chart</span>
                  Export Excel
                </button>
              </div>
            )}

            {/* Period selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: 'daily', label: 'Daily', range: 'day' },
                { key: 'weekly', label: 'Weekly', range: 'week' },
                { key: 'monthly', label: 'Monthly', range: 'month' },
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => {
                    setPeriod(p.key);
                    setDateRange(p.range);
                  }}
                  disabled={refreshing}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    period === p.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {refreshing && (
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            )}
            <NotificationBell />
            <div className="w-px h-8 bg-gray-200" />
            <ProfileDropdown />
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">

          {/* ── Period comparison ─────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 h-32 animate-pulse">
                  <div className="w-24 h-3 bg-gray-100 rounded mb-4" />
                  <div className="w-36 h-8 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : periodComparison && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Current {dateRange}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {fmt(periodComparison.current_period.total)}
                </p>
                <p className="text-sm text-gray-500">{periodComparison.current_period.count} transactions</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Previous {dateRange}</p>
                <p className="text-3xl font-bold text-gray-700 mb-1">
                  {fmt(periodComparison.previous_period.total)}
                </p>
                <p className="text-sm text-gray-500">{periodComparison.previous_period.count} transactions</p>
              </div>

              <div className={`rounded-xl border p-6 shadow-sm ${changeUp ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Change</p>
                <div className="flex items-baseline gap-2">
                  <p className={`text-3xl font-bold ${changeUp ? 'text-red-600' : 'text-emerald-600'}`}>
                    {changeUp ? '+' : ''}{periodComparison.change_percentage}%
                  </p>
                  <span className={`material-icons text-xl ${changeUp ? 'text-red-400' : 'text-emerald-400'}`}>
                    {changeUp ? 'trending_up' : 'trending_down'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">vs previous {dateRange}</p>
              </div>
            </div>
          )}

          {/* ── Spending trend ────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Spending Trend</h3>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{period} view</p>
              </div>
            </div>

            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
              </div>
            ) : spendingTrends.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center gap-2">
                <span className="material-icons text-5xl text-gray-200">show_chart</span>
                <p className="text-sm text-gray-400">No data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={spendingTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="period" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `${currency} ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    formatter={(value) => [fmt(value), 'Amount']}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                    formatter={() => 'Total Spending'}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Category breakdown ────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Bar Chart */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Spending by Category</h3>

              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                </div>
              ) : categoryBreakdown.length === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center gap-2">
                  <span className="material-icons text-5xl text-gray-200">bar_chart</span>
                  <p className="text-sm text-gray-400">No category data yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={categoryBreakdown} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="category" 
                      stroke="#94a3b8"
                      style={{ fontSize: '11px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `${currency} ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value, name, props) => [
                        fmt(value),
                        `${props.payload.count} transactions`
                      ]}
                    />
                    <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CAT_COLORS[index % CAT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Category Distribution</h3>

              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                </div>
              ) : categoryBreakdown.length === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center gap-2">
                  <span className="material-icons text-5xl text-gray-200">pie_chart</span>
                  <p className="text-sm text-gray-400">No category data yet</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={110}
                        fill="#8884d8"
                        dataKey="total"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CAT_COLORS[index % CAT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value, name, props) => [
                          fmt(value),
                          `${props.payload.percentage}% (${props.payload.count} txns)`
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Custom Legend */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full">
                    {categoryBreakdown.map((cat, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-sm shrink-0"
                          style={{ backgroundColor: CAT_COLORS[index % CAT_COLORS.length] }}
                        />
                        <span className="text-xs text-gray-700 truncate">
                          {cat.category} ({cat.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category Details Table */}
          {!loading && categoryBreakdown.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Category Details</h3>
              <div className="space-y-4">
                {categoryBreakdown.map((cat, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${CAT_COLORS[i % CAT_COLORS.length]}15` }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-700">{cat.category}</span>
                        <span className="text-sm font-bold text-gray-900">{fmt(cat.total)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{cat.count} transactions</span>
                        <span className="text-xs font-semibold text-gray-500">{cat.percentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          </div>
        </div>
      </div>
    </div>
  );
}