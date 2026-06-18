import { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '../../../lib/utils.js';
import { Skeleton } from '../feedback/Feedback.jsx';

/**
 * TableShell — a hand-rolled ledger table shell.
 *
 * Design choices:
 *  - The header row is a hairline rule with a tiny tracked micro-label. No
 *    "id / name / amount" hovers. No fill. We trust the typographic weight.
 *  - Rows are 44px tall, separated by hairline rules. Zebra is OFF by
 *    default; hover gives a paper-deep wash.
 *  - Numeric columns are right-aligned, monospaced, and use the Money
 *    component. ID columns are monospaced.
 *  - Sortable columns click to sort. The active sort indicator is an arrow
 *    glyph next to the header label, not a separate column chip.
 *  - Built-in search filters by string match across `searchable` columns.
 *  - Empty state: a quiet, centered, instructional message.
 */
export function TableShell({
  columns,
  data,
  loading = false,
  searchable = false,
  searchPlaceholder = 'Search…',
  emptyTitle = 'No records',
  emptyDescription = 'Once records arrive, they will list here in chronological order.',
  emptyAction = null,
  onRowClick,
  rowKey = (row, i) => row.id ?? i,
  initialSort = null,
  pageSize = 25,
  className,
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(initialSort); // { key, dir }
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!query) return data;
    const q = query.toLowerCase();
    const searchCols = columns.filter((c) => c.searchable !== false).map((c) => c.key);
    return data.filter((row) => searchCols.some((k) => String(row[k] ?? '').toLowerCase().includes(q)));
  }, [query, data, columns]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const out = [...filtered].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv));
    });
    return sort.dir === 'desc' ? out.reverse() : out;
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const slice = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const onHeaderClick = useCallback((col) => {
    if (!col.sortable) return;
    setSort((cur) => {
      if (!cur || cur.key !== col.key) return { key: col.key, dir: 'asc' };
      if (cur.dir === 'asc') return { key: col.key, dir: 'desc' };
      return null;
    });
  }, []);

  return (
    <div className={cn('panel', className)}>
      {searchable && (
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-rule sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-ink-muted" strokeWidth={1.75} />
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent border-0 border-b border-rule pl-6 pr-7 py-1.5 text-sm placeholder:text-ink-faint focus:outline-none focus:border-ink"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-0 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-0.5">
                <X size={14} strokeWidth={1.75} />
              </button>
            )}
          </div>
          <p className="text-xs text-ink-muted num">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
            {query && data.length !== filtered.length && ` of ${data.length}`}
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] text-sm">
          <thead>
            <tr className="border-b border-rule">
              {columns.map((col) => {
                const isSorted = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    onClick={() => onHeaderClick(col)}
                    className={cn(
                      'px-4 py-2.5 text-micro uppercase tracking-eyebrow font-semibold text-ink-muted',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      !col.align && 'text-left',
                      col.sortable && 'cursor-pointer select-none hover:text-ink'
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        isSorted
                          ? (sort.dir === 'asc' ? <ChevronUp size={12} strokeWidth={1.75} /> : <ChevronDown size={12} strokeWidth={1.75} />)
                          : <ChevronsUpDown size={12} strokeWidth={1.5} className="text-ink-faint" />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`s-${i}`} className="border-b border-rule last:border-0">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-2.5">
                      <Skeleton className="h-3 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : slice.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <p className="font-display text-base text-ink">{emptyTitle}</p>
                  {emptyDescription && <p className="mt-1 text-sm text-ink-muted">{emptyDescription}</p>}
                  {emptyAction && <div className="mt-4">{emptyAction}</div>}
                </td>
              </tr>
            ) : (
              slice.map((row, i) => (
                <tr
                  key={rowKey(row, i)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-rule last:border-0 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-paper-deep/60'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-2.5 align-middle',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.mono && 'num',
                      )}
                    >
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-rule text-xs text-ink-muted">
          <p>Page <span className="num">{safePage + 1}</span> of <span className="num">{pageCount}</span></p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="h-7 px-2.5 text-xs border border-rule-strong rounded-sm bg-paper hover:bg-paper-deep disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="h-7 px-2.5 text-xs border border-rule-strong rounded-sm bg-paper hover:bg-paper-deep disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
