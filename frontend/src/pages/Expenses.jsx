import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, Download, FileText, Plus, RefreshCw, ScanText, Search, SlidersHorizontal, X } from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { Panel, PanelHeader, PanelTitle } from '../components/Panel.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import Button from '../components/Button.jsx';
import { Input, Select, Textarea } from '../components/Field.jsx';
import { Modal } from '../components/Modal.jsx';
import { StatusPill } from '../components/StatusPill.jsx';
import { Money } from '../components/Money.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { formatDate } from '../lib/date.js';
import { cn } from '../lib/utils.js';
import { EmptyState, ErrorState, Spinner } from '../components/Feedback.jsx';
import { OCRReceiptModal } from '../components/OCRReceiptModal.jsx';

const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const CATEGORIES = [
  { value: 'FOOD', label: 'Food & Dining' },
  { value: 'TRANSPORT', label: 'Transportation' },
  { value: 'OFFICE', label: 'Office Supplies' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'SALARY', label: 'Salary & Wages' },
  { value: 'RENT', label: 'Rent' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'OTHER', label: 'Other' },
];

const categoryLabel = (value) => CATEGORIES.find((c) => c.value === value)?.label ?? value ?? '-';

const personName = (expense) => (
  expense?.submitted_by_name
  ?? expense?.user_name
  ?? expense?.user_details?.full_name
  ?? expense?.user_details?.username
  ?? expense?.user_details?.email
  ?? 'Team member'
);

const roleLabel = (role) => {
  const normalized = String(role ?? '').toUpperCase();
  if (normalized === 'OWNER') return 'Owner view';
  if (normalized === 'STAFF') return 'Staff view';
  return 'Workspace view';
};

const expensePayload = (form) => ({
  title: form.title,
  amount: form.amount,
  date: form.date,
  category: form.category,
  vendor: form.vendor,
  description: form.description,
});

export default function Expenses() {
  const { currency, role, organization } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [q, setQ] = useState(params.get('search') ?? params.get('q') ?? '');
  const [status, setStatus] = useState(params.get('status') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [categories] = useState(CATEGORIES);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 25;

  const [modalOpen, setModalOpen] = useState(params.get('new') === '1');
  const [ocrOpen, setOcrOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);

  const isStaff = String(role ?? '').toUpperCase() === 'STAFF';
  const hasFilters = Boolean(q || status || category);
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  useEffect(() => {
    setLoading(true);
    setLoadError('');

    const next = new URLSearchParams();
    if (q) next.set('search', q);
    if (status) next.set('status', status);
    if (category) next.set('category', category);
    next.set('page', String(page));
    next.set('page_size', String(pageSize));
    setParams(next, { replace: true });

    api.get('/expenses/', { params: Object.fromEntries(next) })
      .then((r) => {
        const data = r.data;
        const list = data?.results ?? data ?? [];
        setRows(Array.isArray(list) ? list : []);
        setCount(data?.count ?? (Array.isArray(list) ? list.length : 0));
      })
      .catch(() => {
        setRows([]);
        setCount(0);
        setLoadError('Expenses could not be loaded. Your saved records were not changed.');
      })
      .finally(() => setLoading(false));
  }, [q, status, category, page, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalAmount = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [rows]
  );

  const closeModal = () => { setModalOpen(false); setEditing(null); };
  const openNew = () => { setEditing(null); setModalOpen(true); };
  const retryLoad = () => setRefreshKey((key) => key + 1);
  const clearFilters = () => {
    setQ('');
    setStatus('');
    setCategory('');
    setPage(1);
  };

  const exportFilename = (response) => {
    const disposition = response?.headers?.['content-disposition'];
    const match = /filename="?([^";]+)"?/.exec(disposition || '');
    return match ? match[1] : `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
  };

  const exportCsv = async () => {
    const next = new URLSearchParams();
    if (q) next.set('search', q);
    if (status) next.set('status', status);
    if (category) next.set('category', category);

    try {
      const response = await api.get('/expenses/export_csv/', {
        params: Object.fromEntries(next),
        responseType: 'blob',
      });
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportFilename(response);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Expense CSV exported.');
    } catch {
      toast.error('Could not export expenses.');
    }
  };

  const onSaved = () => {
    closeModal();
    toast.success(editing ? 'Expense updated.' : 'Expense added.');
    setRefreshKey((key) => key + 1);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
      <PageHeader
        byline={`${roleLabel(role)}${organization?.name ? ` - ${organization.name}` : ''}`}
        title="Expenses"
        lede="Track expenses, receipts, and approvals."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Download size={14} />}
              onClick={exportCsv}
              disabled={loading || count === 0}
            >
              Export CSV
            </Button>
            <Button variant="secondary" size="sm" iconRight={<ScanText size={14} />} onClick={() => setOcrOpen(true)}>
              Scan receipt
            </Button>
            <Button variant="primary" size="sm" iconRight={<Plus size={14} />} onClick={openNew}>
              Add expense
            </Button>
          </>
        }
      />

      <section className="mt-3 border-y border-rule" aria-label="Expense filters">
        <div className="flex flex-col gap-3 py-2.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Filter ledger</p>
              <p className="text-xs text-ink-muted">
                {hasFilters ? 'Matching expenses.' : 'Search expenses by title, vendor, notes, or submitter.'}
              </p>
            </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <SlidersHorizontal size={14} strokeWidth={1.5} aria-hidden="true" />
              <span>{count} {count === 1 ? 'entry' : 'entries'}</span>
              {hasFilters && (
                <Button variant="ghost" size="xs" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6">
              <label className="field-label" htmlFor="expense-search">Search</label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <input
                  id="expense-search"
                  type="search"
                  placeholder="Search title, vendor, notes, or submitter"
                  value={q}
                  onChange={(event) => { setQ(event.target.value); setPage(1); }}
                  className="w-full h-10 pl-9 pr-3 bg-paper-deep border border-rule rounded-sm text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:bg-paper focus:border-cinnabar-500 focus:ring-2 focus:ring-cinnabar-500/15 transition-colors"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <Select label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
                {STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </Select>
            </div>
            <div className="md:col-span-3">
              <Select label="Category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
                <option value="">All categories</option>
                {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </Select>
            </div>
          </div>
        </div>
      </section>

      <Panel className="mt-3">
        <PanelHeader
          action={
            <Button variant="ghost" size="sm" iconLeft={<RefreshCw size={14} />} onClick={retryLoad} disabled={loading}>
              Refresh
            </Button>
          }
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <PanelTitle>Expense ledger</PanelTitle>
            <span className="text-xs text-ink-muted hidden sm:inline">-</span>
            <span className="text-xs text-ink-muted">
              {rows.length} of {count} shown - Total <span className="num text-ink"><Money value={totalAmount} currency={currency} /></span>
            </span>
          </div>
        </PanelHeader>

        {loading ? (
          <div className="py-14 flex flex-col items-center justify-center gap-3 text-sm text-ink-muted">
            <Spinner className="text-ink-muted" />
            <span>Loading expense records...</span>
          </div>
        ) : loadError ? (
          <ErrorState
            title="Expenses are unavailable"
            description={loadError}
            action={<Button variant="secondary" onClick={retryLoad}>Try again</Button>}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No expenses match these filters' : 'No expenses recorded yet'}
            description={hasFilters
              ? 'Clear one or more filters to return to the full ledger.'
              : isStaff
                ? 'Submit your first expense.'
                : 'Add an expense or scan a receipt.'}
            action={
              hasFilters
                ? <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
                : <Button variant="primary" iconRight={<Plus size={14} />} onClick={openNew}>Add expense</Button>
            }
          />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-micro uppercase tracking-eyebrow text-ink-muted border-b border-rule">
                    <th className="py-2.5 pl-5 font-medium">Date</th>
                    <th className="py-2.5 font-medium">Expense</th>
                    <th className="py-2.5 font-medium">Category</th>
                    <th className="py-2.5 font-medium hidden lg:table-cell">Submitted by</th>
                    <th className="py-2.5 font-medium hidden xl:table-cell">Receipt</th>
                    <th className="py-2.5 font-medium">Status</th>
                    <th className="py-2.5 pr-5 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {rows.map((expense) => (
                    <tr
                      key={expense.id}
                      onClick={() => setDetail(expense)}
                      className="cursor-pointer hover:bg-paper-deep/60 transition-colors"
                    >
                      <td className="py-2.5 pl-5 text-ink-soft text-xs whitespace-nowrap w-28">
                        {formatDate(expense.date ?? expense.created_at, 'short')}
                      </td>
                      <td className="py-2.5 min-w-0">
                        <p className="text-ink font-medium truncate">{expense.title ?? expense.description ?? '-'}</p>
                        <p className="text-[11px] text-ink-muted truncate">{expense.vendor || 'No vendor'}</p>
                      </td>
                      <td className="py-2.5 text-ink-soft">{categoryLabel(expense.category)}</td>
                      <td className="py-2.5 text-ink-soft hidden lg:table-cell">
                        <span className="inline-flex items-center gap-2">
                          <Avatar name={personName(expense)} size={20} />
                          <span className="truncate max-w-[140px]">{personName(expense)}</span>
                        </span>
                      </td>
                      <td className="py-2.5 text-ink-soft hidden xl:table-cell">
                        {expense.receipt ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                            <FileText size={13} strokeWidth={1.5} aria-hidden="true" />
                            Attached
                          </span>
                        ) : (
                          <span className="text-xs text-ink-muted">None</span>
                        )}
                      </td>
                      <td className="py-2.5"><StatusPill status={expense.status} /></td>
                      <td className="py-2.5 pr-5 num text-right text-ink whitespace-nowrap">
                        <Money value={expense.amount} currency={expense.currency ?? currency} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-rule">
              {rows.map((expense) => (
                <button
                  key={expense.id}
                  type="button"
                  onClick={() => setDetail(expense)}
                  className="w-full px-4 py-3.5 text-left hover:bg-paper-deep/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{expense.title ?? expense.description ?? '-'}</p>
                      <p className="mt-1 text-xs text-ink-muted truncate">{expense.vendor || 'No vendor'} - {categoryLabel(expense.category)}</p>
                      <p className="mt-1 text-xs text-ink-muted">{formatDate(expense.date ?? expense.created_at, 'short')} - {personName(expense)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="num text-sm text-ink"><Money value={expense.amount} currency={expense.currency ?? currency} /></p>
                      <div className="mt-1"><StatusPill status={expense.status} /></div>
                    </div>
                  </div>
                  {expense.receipt && (
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-soft">
                      <FileText size={13} strokeWidth={1.5} aria-hidden="true" />
                      Receipt attached
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {count > pageSize && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-3 border-t border-rule">
            <span className="text-xs text-ink-muted">Page {page} of {totalPages}</span>
          <div className="flex w-full items-center gap-1 sm:w-auto">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page * pageSize >= count} onClick={() => setPage((current) => current + 1)}>Next</Button>
          </div>
          </div>
        )}
      </Panel>

      {modalOpen && (
        <ExpenseEditor
          editing={editing}
          categories={categories}
          defaultCurrency={currency}
          role={role}
          onClose={closeModal}
          onSaved={onSaved}
          onCreated={() => setRefreshKey((key) => key + 1)}
        />
      )}

      {detail && (
        <ExpenseDetail
          row={detail}
          currency={currency}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setEditing(detail);
            setDetail(null);
            setModalOpen(true);
          }}
        />
      )}

      <OCRReceiptModal open={ocrOpen} onClose={() => setOcrOpen(false)} onCreated={() => setRefreshKey((key) => key + 1)} />
    </div>
  );
}

function CenteredExpenseModal({ open, onClose, title, description, children, size = 'lg' }) {
  const ref = useRef(null);
  const widths = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return undefined;
    const handle = (event) => {
      if (event.target === dlg) onClose?.();
    };
    dlg.addEventListener('close', handle);
    return () => dlg.removeEventListener('close', handle);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      onClick={(event) => {
        if (event.target === ref.current) onClose?.();
      }}
      className={cn(
        'mx-auto max-h-[100dvh] w-full max-w-[calc(100vw-1rem)] p-0 bg-transparent text-ink sm:max-h-[90vh]',
        'backdrop:bg-inkwell-900/40 backdrop:backdrop-blur-sm',
        'open:animate-drawer',
        widths[size],
      )}
    >
      <div className="m-2 max-h-[calc(100dvh-1rem)] bg-paper border border-rule rounded-md shadow-pop overflow-hidden sm:m-6 sm:max-h-[calc(90vh-3rem)]">
        <header className="flex items-start justify-between gap-3 px-4 py-3.5 border-b border-rule sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-medium leading-tight text-ink">{title}</h2>
            {description && <p className="mt-1 text-sm text-ink-muted leading-snug">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 -mr-1.5 -mt-1 p-1.5 rounded-sm text-ink-muted hover:text-ink hover:bg-paper-deep transition-colors"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </header>
        <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto px-4 py-4 sm:max-h-[calc(90vh-9rem)] sm:px-5">
          {children}
        </div>
      </div>
    </dialog>
  );
}

function ExpenseEditor({ editing, categories, defaultCurrency, role, onClose, onSaved, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState(() => ({
    title: editing?.title ?? editing?.description ?? '',
    description: editing?.description ?? '',
    amount: editing?.amount ?? '',
    date: editing?.date ?? new Date().toISOString().slice(0, 10),
    category: editing?.category ?? '',
    vendor: editing?.vendor ?? '',
  }));
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState({});
  const [ocrOpen, setOcrOpen] = useState(false);
  const isStaff = String(role ?? '').toUpperCase() === 'STAFF';

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event?.preventDefault();
    setSubmitting(true);
    setErr({});

    try {
      let saved;
      if (editing) {
        const res = await api.patch(`/expenses/${editing.id}/`, expensePayload(form));
        saved = res.data;
      } else {
        const res = await api.post('/expenses/', expensePayload(form));
        saved = res.data;
      }
      onSaved(saved);
    } catch (error) {
      const data = error?.response?.data;
      if (data && typeof data === 'object') {
        const fieldErrors = {};
        Object.entries(data).forEach(([key, value]) => {
          fieldErrors[key] = Array.isArray(value) ? value[0] : String(value);
        });
        setErr(fieldErrors);
      } else {
        toast.error('Could not save the expense.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CenteredExpenseModal
      open
      onClose={onClose}
      title={editing ? 'Edit expense' : 'Add expense'}
      description={editing ? 'Update this expense.' : 'Record a business cost.'}
      size="lg"
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {err.detail && (
          <div className="rounded-sm border border-cinnabar-200 bg-cinnabar-50 px-3 py-2 text-sm text-cinnabar-700">
            {err.detail}
          </div>
        )}

        {!editing && (
          <div className="rounded-md border border-rule bg-paper-deep/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">Scan a receipt</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  Upload a receipt and review extracted details.
                </p>
              </div>
              <Button variant="secondary" size="sm" iconRight={<ScanText size={14} />} onClick={() => setOcrOpen(true)}>
                Scan receipt
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-ink-muted">
              <span className="h-px flex-1 bg-rule" />
              <span>or enter details manually</span>
              <span className="h-px flex-1 bg-rule" />
            </div>
          </div>
        )}

        <Input
          label="Expense title"
          value={form.title}
          onChange={update('title')}
          required
          placeholder="e.g. Lunch with supplier"
          error={err.title}
          help="Use a short, recognizable name."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input type="number" step="0.01" min="0" label="Amount" value={form.amount} onChange={update('amount')} required error={err.amount} />
          <Select label="Currency" value={defaultCurrency} disabled>
            {['NPR', 'INR', 'USD', 'EUR'].map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Input type="date" label="Expense date" value={form.date} onChange={update('date')} required error={err.date} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Category" value={form.category} onChange={update('category')} error={err.category}>
            <option value="">Select category</option>
            {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </Select>
          <Input label="Vendor" value={form.vendor} onChange={update('vendor')} placeholder="Supplier or shop name" error={err.vendor} />
        </div>

        <Textarea
          label="Notes"
          rows={3}
          value={form.description}
          onChange={update('description')}
          placeholder="Add context or approval notes."
          error={err.description}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-rule pt-4">
          <p className="text-xs text-ink-muted">
            {isStaff
              ? 'Saved expenses go to the owner for approval.'
              : 'Approval handling follows backend rules.'}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting} iconRight={!submitting && <ArrowRight size={14} />}>
              {submitting ? 'Saving...' : editing ? 'Update expense' : 'Save expense'}
            </Button>
          </div>
        </div>
      </form>
      <OCRReceiptModal
        open={ocrOpen}
        onClose={() => setOcrOpen(false)}
        onCreated={() => {
          onCreated?.();
          setOcrOpen(false);
          onClose();
        }}
      />
    </CenteredExpenseModal>
  );
}

function ExpenseDetail({ row, currency, onClose, onEdit }) {
  return (
    <Modal open onClose={onClose} title="Expense details" size="lg">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-micro uppercase tracking-eyebrow text-ink-muted">{categoryLabel(row.category)}</p>
            <h2 className="font-display text-2xl mt-1 text-ink break-words">{row.title ?? row.description ?? 'Untitled expense'}</h2>
            <p className="text-sm text-ink-soft mt-1 break-words">{row.vendor ?? 'No vendor'} - {formatDate(row.date ?? row.created_at, 'long')}</p>
          </div>
          <div className="sm:text-right">
            <p className="num text-2xl text-ink"><Money value={row.amount} currency={row.currency ?? currency} /></p>
            <div className="mt-1"><StatusPill status={row.status} /></div>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 border-t border-rule pt-3 text-sm">
          <div>
            <dt className="text-micro uppercase tracking-eyebrow text-ink-muted">Submitted by</dt>
            <dd className="mt-1 flex items-center gap-2 text-ink">
              <Avatar name={personName(row)} size={22} />
              <span className="min-w-0 break-words">{personName(row)}</span>
            </dd>
          </div>
          <div>
            <dt className="text-micro uppercase tracking-eyebrow text-ink-muted">Created</dt>
            <dd className="mt-1 text-ink">{formatDate(row.submitted_at ?? row.created_at, 'long')}</dd>
          </div>
        </dl>

        {row.description && row.description !== row.title && (
          <p className="text-sm text-ink-soft border-t border-rule pt-3 break-words">{row.description}</p>
        )}

        <div className="border-t border-rule pt-3">
          <p className="text-micro uppercase tracking-eyebrow text-ink-muted">Receipt</p>
          {row.receipt ? (
            <a href={row.receipt} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-sm text-cinnabar-600 hover:underline">
              <FileText size={14} strokeWidth={1.5} aria-hidden="true" />
              Open receipt attachment
            </a>
          ) : (
            <p className="mt-1 text-sm text-ink-muted">No receipt is attached to this expense.</p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-rule pt-3 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={onEdit}>Edit</Button>
        </div>
      </div>
    </Modal>
  );
}
