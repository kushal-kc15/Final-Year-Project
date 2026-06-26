import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { Panel, PanelHeader, PanelTitle } from "../components/Panel.jsx";
import Button from "../components/Button.jsx";
import { Input, Select } from "../components/Field.jsx";
import { Modal } from "../components/Modal.jsx";
import { Money } from "../components/Money.jsx";
import { EmptyState, ErrorState, Spinner } from "../components/Feedback.jsx";
import PaginationControls from "../components/PaginationControls.jsx";
import { cn } from "../lib/utils.js";
import { BUDGET_CATEGORIES, formatCategoryLabel } from "../lib/categories.js";

const PERIODS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

const categoryLabel = (value) => formatCategoryLabel(value) ?? "-";

const periodLabel = (value) =>
  PERIODS.find((period) => period.value === value)?.label ?? value ?? "Monthly";

const budgetName = (budget) => budget?.name || categoryLabel(budget?.category);

const budgetMath = (budget) => {
  const amount = Number(budget.amount) || 0;
  const spent = Number(budget.spent_amount) || 0;
  const remaining = amount - spent;
  const pct = amount > 0 ? Math.round((spent / amount) * 100) : 0;
  const threshold = Number(budget.alert_threshold) || 80;
  const tone = pct >= 100 ? "over" : pct >= threshold ? "warn" : "ok";
  return { amount, spent, remaining, pct, tone, threshold };
};

const statusLabel = (tone, isActive = true) => {
  if (!isActive) return "Paused";
  if (tone === "over") return "Exceeded";
  if (tone === "warn") return "Near limit";
  return "Healthy";
};

const VIEW_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "RISK", label: "At risk" },
  { value: "PAUSED", label: "Paused" },
  { value: "ALL", label: "All" },
];

export default function Budgets() {
  const { currency, role } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [categories] = useState(BUDGET_CATEGORIES);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  const budgetPageSize = 10;
  const [budgetPage, setBudgetPage] = useState(1);

  const isExplicitStaff = String(role ?? "").toUpperCase() === "STAFF";
  const canManage = !isExplicitStaff;

  const refresh = useCallback(() => {
    setLoading(true);
    setLoadError("");
    api
      .get("/budgets/", { params: { page_size: 100 } })
      .then((response) => {
        const data = response.data?.results ?? response.data ?? [];
        setRows(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setRows([]);
        setLoadError(
          "Budgets could not be loaded. Existing budget limits were not changed.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setBudgetPage(1);
  }, [query, statusFilter]);

  const decoratedRows = useMemo(
    () => rows.map((budget) => ({ budget, ...budgetMath(budget) })),
    [rows],
  );

  const activeRows = decoratedRows.filter(
    ({ budget }) => budget.is_active !== false,
  );
  const totalAllocated = activeRows.reduce((sum, row) => sum + row.amount, 0);
  const totalSpent = activeRows.reduce((sum, row) => sum + row.spent, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const totalPct =
    totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
  const nearLimit = activeRows.filter((row) => row.tone === "warn").length;
  const overBudget = activeRows.filter((row) => row.tone === "over").length;
  const budgetStatus =
    overBudget > 0
      ? "Over budget"
      : nearLimit > 0
        ? "Watch closely"
        : "On track";

  const filteredRows = decoratedRows
    .filter(({ budget }) => {
      if (statusFilter === "ACTIVE") return budget.is_active !== false;
      if (statusFilter === "PAUSED") return budget.is_active === false;
      if (statusFilter === "RISK") {
        const { pct, threshold } = budgetMath(budget);
        return budget.is_active !== false && pct >= threshold;
      }
      return true;
    })
    .filter(({ budget }) => {
      const haystack =
        `${budgetName(budget)} ${categoryLabel(budget.category)} ${periodLabel(budget.period)}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    })
    .sort((a, b) => {
      if (a.budget.is_active === false && b.budget.is_active !== false)
        return 1;
      if (a.budget.is_active !== false && b.budget.is_active === false)
        return -1;
      return b.pct - a.pct;
    });

  const pagedRows = useMemo(() => {
    const start = (budgetPage - 1) * budgetPageSize;
    const end = start + budgetPageSize;
    return filteredRows.slice(start, end);
  }, [filteredRows, budgetPage]);

  const openNew = useCallback(() => {
    setEditing(null);
    setModalOpen(true);
  }, []);

  const togglePause = async (budget) => {
    try {
      await api.patch(`/budgets/${budget.id}/`, {
        is_active: !budget.is_active,
      });
      toast.success(
        budget.is_active ? "Budget paused." : "Budget reactivated.",
      );
      refresh();
    } catch (err) {
      const d = err?.response?.data;
      const msg =
        d?.detail ||
        d?.error ||
        d?.message ||
        (Array.isArray(d?.non_field_errors)
          ? d.non_field_errors[0]
          : d?.non_field_errors) ||
        "Could not change the budget status.";
      toast.error(String(msg));
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/budgets/${deleteTarget.id}/`);
      toast.success("Budget removed.");
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      const d = err?.response?.data;
      const msg =
        d?.detail ||
        d?.error ||
        d?.message ||
        (Array.isArray(d?.non_field_errors)
          ? d.non_field_errors[0]
          : d?.non_field_errors) ||
        "Could not remove the budget.";
      toast.error(String(msg));
    } finally {
      setDeleting(false);
    }
  };

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("ACTIVE");
    setBudgetPage(1);
  };

  const isFiltered = query || statusFilter !== "ACTIVE";

  const pageActions = useMemo(
    () => (
      <>
        <Button
          variant="secondary"
          size="sm"
          iconLeft={<RefreshCw size={14} />}
          onClick={refresh}
          disabled={loading}
        >
          Refresh
        </Button>
        {canManage && (
          <Button
            variant="primary"
            size="sm"
            iconRight={<Plus size={14} />}
            onClick={openNew}
          >
            New budget
          </Button>
        )}
      </>
    ),
    [refresh, loading, canManage, openNew],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-2 pb-4 sm:px-6 sm:pt-2 sm:pb-5 lg:px-10">
      <div className="mb-2 flex flex-wrap items-center justify-end gap-1.5 border-b border-rule pb-2" aria-label="Budget actions">
        {pageActions}
      </div>

      {isExplicitStaff && (
        <div className="mt-2 flex items-start gap-3 rounded-sm border border-rule bg-paper-deep px-3 py-2.5 text-sm text-ink-soft">
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink-muted">
            <ShieldCheck size={14} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <div>
            <p className="text-ink">Read-only access</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Budgets are managed by owners. You can view budget usage but cannot make changes.
            </p>
          </div>
        </div>
      )}

      <section
        className="mt-2 border-t border-rule pt-2"
        aria-label="Budget summary"
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-ink">Budget summary</p>
            <div className="w-full sm:w-56">
              <BudgetBar
                pct={totalPct}
                tone={totalPct >= 100 ? "over" : totalPct >= 80 ? "warn" : "ok"}
                compact
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryMetric
              label="Total budget"
              value={<Money value={totalAllocated} currency={currency} />}
              helper={`${activeRows.length} active ${activeRows.length === 1 ? "budget" : "budgets"}`}
            />
            <SummaryMetric
              label="Total spent"
              value={<Money value={totalSpent} currency={currency} />}
            />
            <SummaryMetric
              label={totalRemaining < 0 ? "Overspent by" : "Remaining"}
              value={
                <Money value={Math.abs(totalRemaining)} currency={currency} />
              }
              danger={totalRemaining < 0}
            />
            <SummaryMetric
              label="Status"
              value={budgetStatus}
              helper={
                overBudget > 0
                  ? `${overBudget} exceeded`
                  : nearLimit > 0
                    ? `${nearLimit} near limit`
                    : "Healthy"
              }
              danger={overBudget > 0}
            />
          </div>
          {totalPct > 100 && (
            <div className="flex items-center gap-2 rounded-sm border border-saffron-200 bg-saffron-50 px-2.5 py-1.5 text-xs text-saffron-700">
              <AlertTriangle
                size={14}
                className="shrink-0"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <p>Budget exceeded. Review highlighted categories below.</p>
            </div>
          )}
        </div>
      </section>

      <section
        className="mt-2 border-y border-rule py-2"
        aria-label="Budget filters"
      >
        <div className="grid grid-cols-1 gap-2 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6">
            <label className="field-label" htmlFor="budget-search">
              Search budgets
            </label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <input
                id="budget-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, category, or period"
                className="w-full h-10 md:h-9 pl-9 pr-3 bg-paper-deep border border-rule rounded-sm text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:bg-paper focus:border-moss-500 focus:ring-2 focus:ring-moss-500/15 transition-colors"
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <span className="field-label" id="budget-view-label">
              View
            </span>
            <div
              role="tablist"
              aria-labelledby="budget-view-label"
              className="mt-1 inline-flex w-full rounded-sm border border-rule bg-paper-deep p-0.5"
            >
              {VIEW_OPTIONS.map((opt) => {
                const active = statusFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStatusFilter(opt.value)}
                    className={cn(
                      "flex-1 px-2.5 py-1.5 text-xs font-medium rounded-[3px] transition-colors",
                      active
                        ? "bg-paper text-ink shadow-sm ring-1 ring-rule"
                        : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-2 flex items-end justify-between gap-2">
            <p className="text-xs text-ink-muted">
              {filteredRows.length} of {rows.length}
            </p>
            {isFiltered && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </section>

      <Panel className="mt-2">
        <PanelHeader className="!px-4 !py-2.5">
          <PanelTitle className="!text-base">Budget limits</PanelTitle>
        </PanelHeader>

        {loading ? (
          <div className="py-14 flex flex-col items-center justify-center gap-3 text-sm text-ink-muted">
            <Spinner className="text-ink-muted" />
            <span>Loading budgets...</span>
          </div>
        ) : loadError ? (
          <ErrorState
            title="Budgets are unavailable"
            description={loadError}
            action={
              <Button variant="secondary" onClick={refresh}>
                Try again
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No budgets yet"
            description={
              isExplicitStaff
                ? "No budgets have been set up by the owner yet."
                : "Create a limit for a category so owners can compare approved spend against a clear ceiling."
            }
            action={
              canManage ? (
                <Button
                  variant="primary"
                  iconRight={<Plus size={14} />}
                  onClick={openNew}
                >
                  Create budget
                </Button>
              ) : null
            }
          />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="No budgets match this view"
            description="Clear the search or status filter to return to the full budget list."
            action={
              <Button variant="secondary" onClick={resetFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-rule">
              {pagedRows.map(
                ({ budget, amount, spent, remaining, pct, tone }) => (
                  <BudgetRow
                    key={budget.id}
                    budget={budget}
                    amount={amount}
                    spent={spent}
                    remaining={remaining}
                    pct={pct}
                    tone={tone}
                    currency={currency}
                    canManage={canManage}
                    onEdit={() => {
                      setEditing(budget);
                      setModalOpen(true);
                    }}
                    onToggle={() => togglePause(budget)}
                    onDelete={() => setDeleteTarget(budget)}
                  />
                ),
              )}
            </ul>

            <PaginationControls
              page={budgetPage}
              setPage={setBudgetPage}
              pageSize={budgetPageSize}
              totalItems={filteredRows.length}
            />
          </>
        )}
      </Panel>

      {modalOpen && (
        <BudgetEditor
          editing={editing}
          categories={categories}
          defaultCurrency={currency}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            refresh();
          }}
        />
      )}

      {deleteTarget && (
        <DeleteBudgetDialog
          budget={deleteTarget}
          deleting={deleting}
          onClose={() => !deleting && setDeleteTarget(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

function BudgetRow({
  budget,
  amount,
  spent,
  remaining,
  pct,
  tone,
  currency,
  canManage = false,
  onEdit,
  onToggle,
  onDelete,
}) {
  const cappedTone = budget.is_active === false ? "paused" : tone;

  const isExceeded = remaining < 0 || tone === "over";
  const remainingAbs = Math.abs(remaining);

  const limitValue =
    amount != null ? <Money value={amount} currency={currency} /> : "—";
  const spentValue = <Money value={spent} currency={currency} />;
  const remainingValue = <Money value={remainingAbs} currency={currency} />;

  return (
    <li className="px-4 py-2.5 sm:px-5">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 text-ink font-medium break-words sm:truncate">
              {budgetName(budget)}
            </p>

            {budget.is_active === false ? (
              <span className="ribbon bg-paper-deep text-ink-muted border border-rule whitespace-nowrap">
                Paused
              </span>
            ) : tone === "over" ? (
              <RiskLabel tone="over" label="Exceeded" />
            ) : tone === "warn" ? (
              <RiskLabel tone="warn" label="Near limit" />
            ) : (
              <RiskLabel tone="ok" label="Healthy" />
            )}
          </div>

          <p className="mt-1 text-xs text-ink-muted break-words">
            {categoryLabel(budget.category)} - {periodLabel(budget.period)}
          </p>
        </div>

        <div className={canManage ? "lg:col-span-5" : "lg:col-span-8"}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <div className="min-w-0">
              <span className="text-xs text-ink-muted">Limit </span>
              <span className="num text-ink">{limitValue}</span>
            </div>
            <div className="min-w-0 text-right">
              <span className="text-xs text-ink-muted">Spent </span>
              <span className="num text-ink">{spentValue}</span>
            </div>
          </div>
          <div className="mt-2">
            <BudgetBar pct={pct} tone={cappedTone} compact />
          </div>
          <div className="mt-1 flex items-center justify-between gap-3 text-[11px]">
            <span
              className={cn(
                "num",
                isExceeded ? "text-saffron-700" : "text-ink-muted",
              )}
            >
              {isExceeded ? "Overspent by " : "Remaining "}
              {remainingValue}
            </span>
            <span className="num shrink-0 text-ink-muted">{pct}% used</span>
          </div>
        </div>

        <div className="lg:col-span-3">
          {canManage && (
            <div className="flex flex-wrap items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                aria-label={
                  budget.is_active === false ? "Resume budget" : "Pause budget"
                }
              >
                {budget.is_active === false ? (
                  <Play size={14} strokeWidth={1.5} />
                ) : (
                  <Pause size={14} strokeWidth={1.5} />
                )}
                <span className="ml-1.5">
                  {budget.is_active === false ? "Resume" : "Pause"}
                </span>
              </Button>
              <Button variant="ghost" size="sm" onClick={onEdit}>
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                aria-label="Delete budget"
              >
                <Trash2 size={14} strokeWidth={1.5} />
                <span className="ml-1.5 hidden sm:inline">Delete</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function SummaryMetric({ label, value, helper, danger = false }) {
  return (
    <div className="rounded-sm border border-rule bg-paper-deep/30 px-3 py-2">
      <p className="text-xs text-ink-muted">{label}</p>
      <p
        className={cn(
          "num mt-0.5 text-lg font-medium",
          danger ? "text-saffron-700" : "text-ink",
        )}
      >
        {value}
      </p>
      {helper && <p className="mt-0.5 text-[11px] text-ink-muted">{helper}</p>}
    </div>
  );
}

function RiskLabel({ tone, label }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium",
        tone === "over"
          ? "border-saffron-200 bg-saffron-50 text-saffron-700"
          : tone === "warn"
            ? "border-saffron-200 bg-saffron-50 text-saffron-700"
            : "border-moss-500/20 bg-moss-50 text-moss-700",
      )}
    >
      {tone === "over" ? (
        <AlertTriangle size={12} strokeWidth={1.5} />
      ) : (
        <CheckCircle2 size={12} strokeWidth={1.5} />
      )}
      {label}
    </span>
  );
}

function BudgetBar({ pct, tone, compact = false }) {
  const color =
    tone === "over"
      ? "bg-saffron-500"
      : tone === "warn"
        ? "bg-saffron-500"
        : tone === "paused"
          ? "bg-ink-faint"
          : "bg-ink";
  const cappedPct = Math.min(100, Math.max(0, pct));
  const left = Math.max(0, 100 - pct);
  const usageLabel = pct > 100 ? "Over limit" : `${pct}% used`;

  return (
    <div>
      <div
        className={cn(
          "bg-rule rounded-pill overflow-hidden ring-1 ring-inset ring-black/5",
          compact ? "h-1.5" : "h-2.5",
        )}
        aria-hidden="true"
      >
        <div
          className={cn("h-full transition-all", color)}
          style={{ width: `${cappedPct}%` }}
        />
      </div>
      {!compact && (
        <div className="flex items-center justify-between mt-1 text-[11px] text-ink-muted">
          <span className="num">{usageLabel}</span>
          <span className="num">
            {pct > 100 ? "Exceeded" : `${left}% left`}
          </span>
        </div>
      )}
    </div>
  );
}

function BudgetEditor({
  editing,
  categories,
  defaultCurrency,
  onClose,
  onSaved,
}) {
  const toast = useToast();
  const [form, setForm] = useState(() => ({
    name: editing?.name ?? "",
    category: editing?.category ?? "",
    amount: editing?.amount ?? "",
    period: editing?.period ?? "MONTHLY",
    start_date: editing?.start_date ?? new Date().toISOString().slice(0, 10),
    is_active: editing?.is_active ?? true,
  }));
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);
  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setErr({});
    setSaving(true);
    try {
      const payload = {
        name: form.name || categoryLabel(form.category),
        category: form.category,
        amount: form.amount,
        period: form.period,
        start_date: form.start_date,
        is_active: form.is_active,
      };
      if (editing) await api.patch(`/budgets/${editing.id}/`, payload);
      else await api.post("/budgets/", payload);
      onSaved();
    } catch (error) {
      const data = error?.response?.data;
      if (data && typeof data === "object") {
        const fieldErrors = {};
        Object.entries(data).forEach(([key, value]) => {
          fieldErrors[key] = Array.isArray(value) ? value[0] : String(value);
        });
        setErr(fieldErrors);
      } else {
        toast.error("Could not save the budget.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Edit budget" : "New budget"}
      description="Set the category, period, and limit used to compare approved spending."
      size="lg"
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {(err.detail || err.error || err.non_field_errors) && (
          <div className="rounded-sm border border-cinnabar-200 bg-cinnabar-50 px-3 py-2 text-sm text-cinnabar-700">
            {err.detail || err.error || err.non_field_errors}
          </div>
        )}
        <Input
          label="Budget name"
          value={form.name}
          onChange={update("name")}
          placeholder="e.g. Monthly travel"
          error={err.name}
          help="Leave blank to use the category name."
        />
        <Select
          label="Category"
          value={form.category}
          onChange={update("category")}
          required
          error={err.category}
        >
          <option value="">Choose a category</option>
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            type="number"
            step="0.01"
            min="0"
            label="Budget amount"
            value={form.amount}
            onChange={update("amount")}
            required
            error={err.amount}
          />
          <Select label="Currency" value={defaultCurrency} disabled>
            {["NPR", "INR", "USD", "EUR"].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select
            label="Period"
            value={form.period}
            onChange={update("period")}
            error={err.period}
          >
            {PERIODS.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </Select>
        </div>
        <Input
          type="date"
          label="Starts on"
          value={form.start_date}
          onChange={update("start_date")}
          required
          error={err.start_date}
        />
        <div className="flex flex-col gap-3 border-t border-rule pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">
            Only active budgets are counted in the overview and risk list.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save budget" : "Create budget"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function DeleteBudgetDialog({ budget, deleting, onClose, onConfirm }) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Remove budget?"
      description="This removes the budget limit from the workspace. Existing expenses are not deleted."
      size="sm"
    >
      <div className="space-y-4">
        <div className="rounded-sm border border-rule bg-paper-deep px-3 py-3 text-sm">
          <p className="font-medium text-ink">{budgetName(budget)}</p>
          <p className="mt-1 text-xs text-ink-muted">
            {categoryLabel(budget.category)} - {periodLabel(budget.period)}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={deleting}
            iconLeft={<Trash2 size={14} />}
          >
            {deleting ? "Removing..." : "Remove budget"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
