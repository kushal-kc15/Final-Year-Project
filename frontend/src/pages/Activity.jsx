import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Edit3, FileText, Plus, Receipt, RefreshCw, Search, XCircle } from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Panel, PanelHeader, PanelTitle } from '../components/Panel.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { formatDate } from '../lib/date.js';
import { EmptyState, ErrorState, Spinner } from '../components/Feedback.jsx';
import { Money } from '../components/Money.jsx';
import PaginationControls from '../components/PaginationControls.jsx';
import Button from '../components/Button.jsx';
import { Select } from '../components/Field.jsx';
import { cn } from '../lib/utils.js';

const VERB_ICON = {
  created: Plus,
  submitted: FileText,
  approved: CheckCircle2,
  rejected: XCircle,
  updated: Edit3,
  paid: CheckCircle2,
  reimbursed: CheckCircle2,
};

const roleLabel = (role) => {
  const normalized = String(role ?? '').toUpperCase();
  if (normalized === 'OWNER') return 'Owner activity trail';
  if (normalized === 'STAFF') return 'Staff activity view';
  return 'Workspace activity trail';
};

const normalizeVerb = (row) => {
  const action = row?.action_type ?? row?.action ?? row?.verb;
  if (!action) return 'created';
  return String(action).toLowerCase();
};
const actorName = (row) => (
  row?.user_name
  ?? row?.user_email
  ?? row?.actor_name
  ?? row?.actor?.username
  ?? row?.user?.username
  ?? 'Someone'
);
const objectText = (row) => row?.description ?? row?.object_repr ?? row?.target ?? 'an expense';
const eventTime = (row) => row?.timestamp ?? row?.created_at ?? row?.date ?? null;
const metadataText = (row) => {
  const metadata = row?.metadata;
  if (!metadata || typeof metadata !== 'object') return '';
  const details = [];
  if (metadata.expense_id != null) details.push(`Expense #${metadata.expense_id}`);
  if (metadata.status) details.push(`Status: ${metadata.status}`);
  if (metadata.approved_by != null) details.push(`Approved by #${metadata.approved_by}`);
  if (metadata.rejected_by != null) details.push(`Rejected by #${metadata.rejected_by}`);
  return details.join(' - ');
};

const readableVerb = (verb) => {
  if (!verb) return 'Created';
  return verb
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const eventTone = (verb) => {
  if (verb === 'approved' || verb === 'paid' || verb === 'reimbursed') return 'moss';
  if (verb === 'rejected') return 'cinnabar';
  return 'ink';
};

export default function Activity() {
  const { currency, role, organization } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [q, setQ] = useState('');
  const [verbFilter, setVerbFilter] = useState('');

  const activityPageSize = 15;
  const [activityPage, setActivityPage] = useState(1);

  const loadActivity = () => {
    setLoading(true);
    setLoadError('');
    api.get('/activity-logs/', { params: { page_size: 100 } })
      .then((response) => {
        const data = response.data?.results ?? response.data ?? [];
        setRows(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setRows([]);
        setLoadError('Activity logs could not be loaded. No workspace data was changed.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadActivity(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setActivityPage(1);
  }, [q, verbFilter]);

  const normalizedRows = useMemo(
    () => rows.map((row, index) => {
      const verb = normalizeVerb(row);
      return {
        key: row?.id ?? `${verb}-${index}`,
        row,
        verb,
        actionLabel: readableVerb(verb),
        actor: actorName(row),
        object: objectText(row),
        metadata: metadataText(row),
        timestamp: eventTime(row),
        amount: row?.amount,
        currency: row?.currency ?? currency,
      };
    }),
    [rows, currency]
  );

  const actionTypes = useMemo(
    () => Array.from(new Set(normalizedRows.map((event) => event.verb))).filter(Boolean).sort(),
    [normalizedRows]
  );

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return normalizedRows.filter((event) => {
      const matchesVerb = !verbFilter || event.verb === verbFilter;
      const haystack = `${event.actor} ${event.verb} ${event.actionLabel} ${event.object} ${event.row?.description ?? ''}`.toLowerCase();
      const matchesSearch = !needle || haystack.includes(needle);
      return matchesVerb && matchesSearch;
    });
  }, [normalizedRows, q, verbFilter]);

  const pagedFilteredRows = useMemo(() => {
    const start = (activityPage - 1) * activityPageSize;
    const end = start + activityPageSize;
    return filteredRows.slice(start, end);
  }, [filteredRows, activityPage]);

  const latestTimestamp = normalizedRows
    .map((event) => event.timestamp)
    .filter(Boolean)
    .sort()
    .at(-1);
  const hasFilters = Boolean(q.trim() || verbFilter);
  const mostCommonAction = useMemo(() => {
    if (normalizedRows.length === 0) return 'No activity';
    const counts = normalizedRows.reduce((map, event) => {
      map.set(event.verb, (map.get(event.verb) ?? 0) + 1);
      return map;
    }, new Map());
    const [verb] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0] ?? [];
    return readableVerb(verb);
  }, [normalizedRows]);
  const activeFilterLabel = hasFilters
    ? [q.trim() ? 'Search' : null, verbFilter ? readableVerb(verbFilter) : null].filter(Boolean).join(' + ')
    : 'None';

  const clearFilters = () => {
    setQ('');
    setVerbFilter('');
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
      <PageHeader
        byline={`${roleLabel(role)}${organization?.name ? ` - ${organization.name}` : ''}`}
        title="Activity"
        lede="Review recent workspace activity."
        actions={
          <Button variant="secondary" size="sm" iconLeft={<RefreshCw size={14} />} onClick={loadActivity} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {!loading && !loadError && normalizedRows.length > 0 && (
        <section className="mt-4 border-t border-rule pt-3" aria-label="Activity summary">
          <p className="text-sm font-medium text-ink">Summary</p>
          <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryMetric label="Shown" value={filteredRows.length} helper={`${normalizedRows.length} loaded`} />
            <SummaryMetric label="Common action" value={mostCommonAction} />
            <SummaryMetric label="Latest" value={latestTimestamp ? formatDate(latestTimestamp, 'relative') : 'Unavailable'} />
            <SummaryMetric label="Filters" value={activeFilterLabel} />
          </div>
        </section>
      )}

      <section className="mt-3 border-y border-rule py-2.5" aria-label="Activity filters">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6">
            <label className="field-label" htmlFor="activity-search">Search activity</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" strokeWidth={1.5} aria-hidden="true" />
              <input
                id="activity-search"
                type="search"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search actor, action, or description"
                className="w-full h-10 pl-9 pr-3 bg-paper-deep border border-rule rounded-sm text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:bg-paper focus:border-cinnabar-500 focus:ring-2 focus:ring-cinnabar-500/15 transition-colors"
              />
            </div>
          </div>
          <div className="md:col-span-3">
            <Select label="Action type" value={verbFilter} onChange={(event) => setVerbFilter(event.target.value)}>
              <option value="">All actions</option>
              {actionTypes.map((verb) => <option key={verb} value={verb}>{readableVerb(verb)}</option>)}
            </Select>
          </div>
          <div className="md:col-span-3 flex items-end justify-between gap-3">
            <p className="pb-2 text-xs text-ink-muted">{filteredRows.length} shown</p>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
            )}
          </div>
        </div>
      </section>

      <Panel className="mt-3">
        <PanelHeader>
          <PanelTitle>Activity</PanelTitle>
        </PanelHeader>
        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3 text-sm text-ink-muted">
            <Spinner className="text-ink-muted" />
            <span>Loading activity...</span>
          </div>
        ) : loadError ? (
          <ErrorState
            title="Activity is unavailable"
            description={loadError}
            action={<Button variant="secondary" onClick={loadActivity}>Try again</Button>}
          />
        ) : normalizedRows.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Workspace activity will appear here."
          />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="No activity matches this view"
            description="Clear filters to show all activity."
            action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
          />
        ) : (
          <>
            <ol className="relative md:before:absolute md:before:left-9 md:before:top-4 md:before:bottom-4 md:before:w-px md:before:bg-rule">
              {pagedFilteredRows.map((event) => (
                <ActivityItem key={event.key} event={event} />
              ))}
            </ol>

            <PaginationControls
              page={activityPage}
              setPage={setActivityPage}
              pageSize={activityPageSize}
              totalItems={filteredRows.length}
            />
          </>
        )}
      </Panel>
    </div>
  );
}

function ActivityItem({ event }) {
  const Icon = VERB_ICON[event.verb] ?? Receipt;
  const tone = eventTone(event.verb);
  const toneClass = tone === 'moss'
    ? 'text-moss-700 bg-moss-50'
    : tone === 'cinnabar'
      ? 'text-cinnabar-700 bg-cinnabar-50'
      : 'text-ink-soft bg-paper-deep';

  return (
    <li className="relative px-4 py-3.5 md:pl-16 md:pr-5">
      <span className={cn('mb-3 flex h-8 w-8 items-center justify-center rounded-pill md:absolute md:left-5 md:top-3.5', toneClass)}>
        <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Avatar name={event.actor} size={22} />
            <span className="min-w-0 break-words text-sm font-medium text-ink">{event.actor}</span>
            <span className="rounded-sm bg-paper-deep px-1.5 py-0.5 text-[11px] text-ink-muted">{event.actionLabel}</span>
          </div>
          <p className="mt-1 break-words text-sm text-ink-soft">
            {event.object}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">{event.timestamp ? formatDate(event.timestamp, 'long') : 'Time unavailable'}</p>
          {event.metadata && <p className="mt-0.5 text-xs text-ink-muted">{event.metadata}</p>}
        </div>
        {event.amount != null && (
          <p className="num text-sm text-ink sm:text-right">
            <Money value={event.amount} currency={event.currency} />
          </p>
        )}
      </div>
    </li>
  );
}

function SummaryMetric({ label, value, helper }) {
  return (
    <div className="rounded-md border border-rule bg-paper px-4 py-2.5">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 break-words text-xl font-medium text-ink">{value}</p>
      {helper && <p className="mt-1 text-xs text-ink-muted">{helper}</p>}
    </div>
  );
}
