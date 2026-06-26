import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Panel, PanelHeader, PanelTitle } from '../components/Panel.jsx';
import { Money } from '../components/Money.jsx';
import { EmptyState, ErrorState, Spinner } from '../components/Feedback.jsx';
import PaginationControls from '../components/PaginationControls.jsx';
import Button from '../components/Button.jsx';

const normalizeVendor = (row, index, totalSpend) => {
  const vendor = String(row?.vendor || row?.name || '').trim() || 'Unnamed vendor';
  const spend = Number(row?.total_amount ?? row?.total ?? row?.amount) || 0;
  const transactions = Number(row?.transaction_count ?? row?.count ?? row?.entries) || 0;
  const share = totalSpend > 0 ? Math.round((spend / totalSpend) * 100) : 0;

  return {
    key: `${vendor}-${index}`,
    vendor,
    spend,
    transactions,
    share,
    raw: row,
  };
};

export default function Vendors() {
  const { currency } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [q, setQ] = useState('');

  const vendorsPageSize = 10;
  const [vendorsPage, setVendorsPage] = useState(1);

  const loadVendors = useCallback(() => {
    setLoading(true);
    setLoadError('');
    api.get('/expenses/vendor_analytics/')
      .then((response) => {
        const data = response.data?.vendors ?? response.data?.results ?? response.data ?? [];
        setRows(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setRows([]);
        setLoadError('Vendor analytics could not be loaded. Expense records were not changed.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadVendors(); }, [loadVendors]);

  useEffect(() => {
    setVendorsPage(1);
  }, [q]);

  const totalSpend = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row?.total_amount ?? row?.total ?? row?.amount) || 0), 0),
    [rows]
  );

  const normalizedRows = useMemo(
    () => rows
      .map((row, index) => normalizeVendor(row, index, totalSpend))
      .sort((a, b) => b.spend - a.spend),
    [rows, totalSpend]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return normalizedRows;
    return normalizedRows.filter((vendor) => vendor.vendor.toLowerCase().includes(needle));
  }, [q, normalizedRows]);

  const pagedFiltered = useMemo(() => {
    const start = (vendorsPage - 1) * vendorsPageSize;
    const end = start + vendorsPageSize;
    return filtered.slice(start, end);
  }, [filtered, vendorsPage]);

  const transactionCount = normalizedRows.reduce((sum, vendor) => sum + vendor.transactions, 0);
  const topVendor = normalizedRows[0] ?? null;
  const averageSpend = normalizedRows.length > 0 ? totalSpend / normalizedRows.length : 0;
  const hasSearch = q.trim().length > 0;
  const pageActions = useMemo(
    () => (
      <Button variant="secondary" size="sm" iconLeft={<RefreshCw size={14} />} onClick={loadVendors} disabled={loading}>
        Refresh
      </Button>
    ),
    [loadVendors, loading],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-2 pb-4 sm:px-6 sm:pt-2 sm:pb-5 lg:px-10">
      <div className="mb-2 flex flex-wrap items-center justify-end gap-1.5 border-b border-rule pb-2" aria-label="Vendor actions">
        {pageActions}
      </div>

      {!loading && !loadError && normalizedRows.length > 0 && (
        <section className="border-t border-rule pt-2" aria-label="Vendor summary">
          <p className="text-sm font-medium text-ink">Summary</p>
          <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryMetric label="Vendors" value={normalizedRows.length} helper={`${transactionCount} ${transactionCount === 1 ? 'expense' : 'expenses'}`} />
            <SummaryMetric label="Spend" value={<Money value={totalSpend} currency={currency} />} />
            <SummaryMetric label="Top vendor" value={topVendor.vendor} helper={<Money value={topVendor.spend} currency={currency} />} />
            <SummaryMetric label="Average/vendor" value={<Money value={averageSpend} currency={currency} />} />
          </div>
        </section>
      )}

      <section className="mt-2 border-y border-rule py-2" aria-label="Vendor search">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6">
            <label className="field-label" htmlFor="vendor-search">Search vendors</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" strokeWidth={1.5} aria-hidden="true" />
              <input
                id="vendor-search"
                type="search"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search by vendor name"
                className="w-full h-10 md:h-9 pl-9 pr-3 bg-paper-deep border border-rule rounded-sm text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:bg-paper focus:border-moss-500 focus:ring-2 focus:ring-moss-500/15 transition-colors"
              />
            </div>
          </div>
          <div className="md:col-span-6 flex items-end justify-between gap-3">
            <p className="text-xs text-ink-muted">{filtered.length} of {normalizedRows.length} shown</p>
            {hasSearch && (
              <Button variant="ghost" size="sm" onClick={() => setQ('')}>Clear search</Button>
            )}
          </div>
        </div>
      </section>

      <Panel className="mt-2">
        <PanelHeader className="!px-4 !py-2.5">
          <PanelTitle className="!text-base">Vendors</PanelTitle>
        </PanelHeader>
        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3 text-sm text-ink-muted">
            <Spinner className="text-ink-muted" />
            <span>Loading vendors...</span>
          </div>
        ) : loadError ? (
          <ErrorState
            title="Vendor analytics are unavailable"
            description={loadError}
            action={<Button variant="secondary" onClick={loadVendors}>Try again</Button>}
          />
        ) : normalizedRows.length === 0 ? (
          <EmptyState
            title="No vendors yet"
            description="Add vendor names to expenses to see vendor spending."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No vendors match this search"
            description="Clear the search to return to the full vendor list."
            action={<Button variant="secondary" onClick={() => setQ('')}>Clear search</Button>}
          />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-micro uppercase tracking-eyebrow text-ink-muted border-b border-rule">
                    <th className="py-2.5 pl-5 font-medium">Vendor</th>
                    <th className="py-2.5 font-medium text-right">Expenses</th>
                    <th className="py-2.5 font-medium text-right">Spend</th>
                    <th className="py-2.5 pr-5 font-medium text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {pagedFiltered.map((vendor) => (
                    <tr key={vendor.key} className="hover:bg-paper-deep/60 transition-colors">
                      <td className="py-2.5 pl-5">
                        <p className="max-w-sm truncate text-ink font-medium">{vendor.vendor}</p>
                      </td>
                      <td className="py-2.5 text-right num text-ink-muted">{vendor.transactions}</td>
                      <td className="py-2.5 text-right num text-ink"><Money value={vendor.spend} currency={currency} /></td>
                      <td className="py-2.5 pr-5 text-right num text-ink-muted">{vendor.share}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-rule">
              {pagedFiltered.map((vendor) => (
                <div key={vendor.key} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{vendor.vendor}</p>
                      <p className="mt-1 text-xs text-ink-muted">{vendor.transactions} {vendor.transactions === 1 ? 'expense' : 'expenses'} - {vendor.share}% share</p>
                    </div>
                    <p className="num text-sm text-ink shrink-0"><Money value={vendor.spend} currency={currency} /></p>
                  </div>
                </div>
              ))}
            </div>

            <PaginationControls
              page={vendorsPage}
              setPage={setVendorsPage}
              pageSize={vendorsPageSize}
              totalItems={filtered.length}
            />
          </>
        )}
      </Panel>
    </div>
  );
}

function SummaryMetric({ label, value, helper }) {
  return (
    <div className="rounded-md border border-rule bg-paper px-3 py-2">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-0.5 break-words text-lg font-medium text-ink">{value}</p>
      {helper && <p className="mt-0.5 text-xs text-ink-muted">{helper}</p>}
    </div>
  );
}
