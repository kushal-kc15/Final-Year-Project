import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calendar, Download, RefreshCw } from "lucide-react";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Panel, PanelHeader, PanelTitle } from "../components/Panel.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { Select, Input } from "../components/Field.jsx";
import { BarChart, DonutChart } from "../components/Charts.jsx";
import { Money } from "../components/Money.jsx";
import { formatCompact } from "../lib/currency.js";
import { EmptyState, ErrorState, Spinner } from "../components/Feedback.jsx";
import Button from "../components/Button.jsx";
import PaginationControls from "../components/PaginationControls.jsx";
import { useToast } from "../components/Toast.jsx";
import { formatCategoryLabel } from "../lib/categories.js";

const PRESETS = [
  { value: "month", label: "This month" },
  { value: "quarter", label: "Last 3 months" },
  { value: "ytd", label: "Year to date" },
  { value: "custom", label: "Custom range" },
];

const CAT_COLORS = [
  "oklch(0.56 0.17 25)",
  "oklch(0.50 0.08 150)",
  "oklch(0.60 0.12 65)",
  "oklch(0.40 0.05 230)",
  "oklch(0.55 0.10 320)",
  "oklch(0.45 0.05 90)",
];

const categoryLabel = (value) => formatCategoryLabel(value) ?? "-";


const roleLabel = (role) => {
  const normalized = String(role ?? "").toUpperCase();
  if (normalized === "OWNER") return "Owner reporting";
  if (normalized === "STAFF") return "Staff reporting";
  return "Workspace reporting";
};

const sourceLabels = {
  trends: "spending trend",
  categories: "category breakdown",
  vendors: "top vendor",
};

export default function Reports() {
  const { currency, role, organization } = useAuth();
  const toast = useToast();
  const [preset, setPreset] = useState("month");
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sourceErrors, setSourceErrors] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);

  const reportsPageSize = 10;
  const [reportsPage, setReportsPage] = useState(1);

  useEffect(() => {
    if (preset === "custom") return;

    const now = new Date();
    const start = new Date();
    if (preset === "month") start.setDate(1);
    else if (preset === "quarter") start.setMonth(now.getMonth() - 3);
    else if (preset === "ytd") start.setMonth(0, 1);

    setFrom(start.toISOString().slice(0, 10));
    setTo(now.toISOString().slice(0, 10));
  }, [preset]);

  const trendPeriod = useMemo(() => {
    // Keep chart labels readable: daily for short ranges, weekly/monthly for longer ranges.
    if (preset === "month") return "daily";
    if (preset === "quarter") return "weekly";
    if (preset === "ytd") return "monthly";
    // For custom range, estimate by date span.
    if (preset === "custom" && from && to) {
      const start = new Date(from);
      const end = new Date(to);
      const days = Number.isFinite(start.getTime()) && Number.isFinite(end.getTime())
        ? Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      if (days <= 35) return "daily";
      if (days <= 140) return "weekly";
      return "monthly";
    }
    return "daily";
  }, [preset, from, to]);

  const loadReports = useCallback(() => {
    if (!from || !to) return;

    setLoading(true);
    setSourceErrors([]);

    Promise.allSettled([
      api.get("/analytics/spending-trends/", {
        params: { start_date: from, end_date: to, period: trendPeriod },
      }),
      api.get("/analytics/category-breakdown/", {
        params: { start_date: from, end_date: to },
      }),
      api.get("/analytics/vendor-summary/", {
        params: { start_date: from, end_date: to, limit: 1 },
      }),
    ])
      .then(([trends, categories, vendors]) => {
        const failed = [];
        if (trends.status !== "fulfilled") failed.push("trends");
        if (categories.status !== "fulfilled") failed.push("categories");
        if (vendors.status !== "fulfilled") failed.push("vendors");

        setSourceErrors(failed);
        setData({
          monthly:
            trends.status === "fulfilled"
              ? (trends.value.data?.trends ?? trends.value.data?.monthly ?? [])
              : [],
          by_category:
            categories.status === "fulfilled"
              ? (categories.value.data?.breakdown ??
                categories.value.data?.categories ??
                categories.value.data?.results ??
                categories.value.data ??
                [])
              : [],
          top_vendor:
            vendors.status === "fulfilled"
              ? (vendors.value.data?.vendors?.[0] ??
                vendors.value.data?.results?.[0] ??
                null)
              : null,
        });
      })
      .catch(() => {
        setSourceErrors(["trends", "categories", "vendors"]);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [from, to, trendPeriod]);

  useEffect(() => {
    loadReports();
  }, [loadReports, refreshKey]);

  useEffect(() => {
    setReportsPage(1);
  }, [preset, from, to]);

  const monthly = data?.monthly ?? [];

  // Ensure stable ordering for top category / donut / table.
  const byCategory = useMemo(() => {
    const rows = data?.by_category ?? [];
    return [...rows].sort((a, b) => {
      const ta = Number(a?.total) || 0;
      const tb = Number(b?.total) || 0;
      // stable fallback (category code/name)
      if (tb !== ta) return tb - ta;
      const aa = String(a?.category ?? a?.name ?? "");
      const bb = String(b?.category ?? b?.name ?? "");
      return aa.localeCompare(bb);
    });
  }, [data?.by_category]);

  const total = byCategory.reduce(
    (sum, category) => sum + (Number(category.total) || 0),
    0,
  );

  const topVendor = data?.top_vendor;
  const allSourcesFailed = sourceErrors.length === 3;
  const partialFailure = sourceErrors.length > 0 && !allSourcesFailed;
  const hasReportData =
    monthly.length > 0 || byCategory.length > 0 || Boolean(topVendor);

  const entryCount = byCategory.reduce(
    (sum, category) => sum + (Number(category.count) || 0),
    0,
  );

  const topCategory =
    byCategory
      .map((category) => ({
        label: categoryLabel(category.category ?? category.name),
        total: Number(category.total) || 0,
      }))
      .sort((a, b) => b.total - a.total)[0] ?? null;

  const donut = byCategory.slice(0, 6).map((category, index) => ({
    label: categoryLabel(category.category ?? category.name),
    value: Number(category.total) || 0,
    color: CAT_COLORS[index % CAT_COLORS.length],
  }));

  const pagedByCategory = useMemo(() => {
    const start = (reportsPage - 1) * reportsPageSize;
    const end = start + reportsPageSize;
    return byCategory.slice(start, end);
  }, [byCategory, reportsPage]);

  const failedCopy = sourceErrors
    .map((source) => sourceLabels[source])
    .join(", ");

  const exportCsv = async () => {
    if (
      exporting ||
      loading ||
      !hasReportData ||
      sourceErrors.length > 0 ||
      !from ||
      !to
    ) {
      return;
    }

    setExporting(true);
    try {
      const response = await api.get("/analytics/export-csv/", {
        params: {
          start_date: from,
          end_date: to,
          period: trendPeriod,
        },
        responseType: "blob",
      });
      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `approved-expense-report_${from}_${to}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Approved expense report exported.");
    } catch {
      toast.error("Could not export the approved expense report.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
      <PageHeader
        byline={`${roleLabel(role)}${organization?.name ? ` - ${organization.name}` : ""}`}
        title="Reports"
        lede="Review spending trends and category breakdowns."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Download size={14} />}
              onClick={exportCsv}
              disabled={
                exporting ||
                loading ||
                !hasReportData ||
                sourceErrors.length > 0 ||
                !from ||
                !to
              }
            >
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<RefreshCw size={14} />}
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={loading || !from || !to}
            >
              Refresh
            </Button>
          </>
        }
      />

      <p className="mt-2 text-xs text-ink-muted">
        Reports are based on <span className="font-medium text-ink">approved</span> expenses only.
      </p>

      <section
        className="mt-3 border-y border-rule py-3"
        aria-label="Report range"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-3">
            <Select
              label="Range"
              value={preset}
              onChange={(event) => setPreset(event.target.value)}
            >
              {PRESETS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>
          {preset === "custom" && (
            <>
              <div className="md:col-span-3">
                <Input
                  label="From"
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="To"
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </div>
            </>
          )}
          <div
            className={preset === "custom" ? "md:col-span-3" : "md:col-span-9"}
          >
            <div className="flex min-w-0 items-center gap-2 rounded-sm bg-paper-deep px-3 py-2 text-xs text-ink-muted">
              <Calendar size={13} strokeWidth={1.5} aria-hidden="true" />
              <span className="num min-w-0 truncate">
                {from || "Start date"} to {to || "End date"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-sm text-ink-muted">
          <Spinner className="text-ink-muted" />
          <span>Loading report data...</span>
        </div>
      ) : allSourcesFailed ? (
        <ErrorState
          title="Reports are unavailable"
          description="Report data could not be loaded. Expense records were not changed."
          action={
            <Button
              variant="secondary"
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              Try again
            </Button>
          }
        />
      ) : !hasReportData ? (
        <EmptyState
          title="No report data in this range"
          description="Try a wider date range or add approved expenses."
        />
      ) : (
        <>
          {partialFailure && (
            <div className="mt-3 flex items-start gap-2 rounded-sm border border-saffron-200 bg-saffron-50 px-3 py-2 text-sm text-saffron-700">
              <AlertTriangle
                size={16}
                className="mt-0.5 shrink-0"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <p>Partial report loaded. Missing: {failedCopy}.</p>
            </div>
          )}

          <section
            className="mt-4 border-t border-rule pt-3"
            aria-label="Reports summary"
          >
            <p className="text-sm font-medium text-ink">Summary</p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryMetric
                label="Total expenses"
                value={entryCount > 0 ? entryCount : "—"}
                helper={entryCount > 0 ? "approved entries" : null}
              />
              <SummaryMetric
                label="Approved amount"
                value={<Money value={total} currency={currency} />}
              />
              <SummaryMetric
                label="Top category"
                value={topCategory?.label ?? "Unavailable"}
                helper={
                  topCategory ? (
                    <Money value={topCategory.total} currency={currency} />
                  ) : null
                }
              />
              <SummaryMetric
                label="Top vendor"
                value={
                  topVendor
                    ? (topVendor.name ?? topVendor.vendor ?? "Vendor")
                    : "Unavailable"
                }
              />
            </div>
          </section>

          <Panel className="mt-4">
            <PanelHeader>
              <div>
                <PanelTitle>Trend</PanelTitle>
                <p className="mt-1 text-xs text-ink-muted">Approved spend over time</p>
              </div>
            </PanelHeader>
            {monthly.length > 0 ? (
              <div className="px-3 pb-2">
                <BarChart
                  data={monthly.map((item) => {
                    // Backend returns { period, period_start, total, count }.
                    const raw = item.period_start ?? item.period ?? item.date;
                    const dateObj = raw ? new Date(raw) : null;

                    const isValidDate =
                      dateObj && !Number.isNaN(dateObj.getTime());
                    const label = (() => {
                      if (!isValidDate) return item.label ?? item.period ?? item.date;
                      // period: daily / weekly / monthly
                      if (trendPeriod === "daily") {
                        return dateObj.toLocaleDateString(undefined, {
                          month: "short",
                          day: "2-digit",
                        });
                      }
                      if (trendPeriod === "weekly") {
                        // show week start, no year to reduce clutter
                        return dateObj.toLocaleDateString(undefined, {
                          month: "short",
                          day: "2-digit",
                        });
                      }
                      // monthly
                      return dateObj.toLocaleDateString(undefined, {
                        month: "short",
                        year: "numeric",
                      });
                    })();

                    return { label, value: item.total };
                  })}
                  height={200}
                  currency={currency}
                />
              </div>
            ) : (
              <EmptyState
                title="No trend data"
                description="No values were returned for this range."
                className="py-8"
              />
            )}
          </Panel>

          <div className="mt-4 grid grid-cols-12 gap-4 lg:gap-5">
            <div className="col-span-12 lg:col-span-7">
              <Panel>
                <PanelHeader>
                  <div>
                    <PanelTitle>Categories</PanelTitle>
                  </div>
                </PanelHeader>
                {byCategory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[34rem] text-sm">
                      <thead>
                        <tr className="text-left text-micro uppercase tracking-eyebrow text-ink-muted border-b border-rule">
                          <th className="py-2.5 pl-5 font-medium">Category</th>
                          <th className="py-2.5 font-medium hidden sm:table-cell">
                            Entries
                          </th>
                          <th className="py-2.5 font-medium text-right pr-3">
                            Spend
                          </th>
                          <th className="py-2.5 font-medium text-right pr-5">
                            Share
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rule">
                        {pagedByCategory.map((category, index) => {
                          const categoryTotal = Number(category.total) || 0;
                          const share =
                            total > 0
                              ? Math.round((categoryTotal / total) * 100)
                              : 0;
                          return (
                            <tr
                              key={
                                category.category ??
                                category.name ??
                                category.id ??
                                index
                              }
                            >
                              <td className="py-3 pl-5 text-ink">
                                <span className="block max-w-xs truncate font-medium">
                                  {categoryLabel(
                                    category.category ?? category.name,
                                  )}
                                </span>
                              </td>
                              <td className="py-3 hidden sm:table-cell num text-ink-muted">
                                {category.count ?? "-"}
                              </td>
                              <td className="py-3 pr-3 num text-right text-ink">
                                <Money value={categoryTotal} currency={currency} />
                              </td>
                              <td className="py-3 pr-5 num text-right text-ink-muted">
                                {share}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    title="No category data"
                    description="No categorized spend was returned."
                    className="py-8"
                  />
                )}

                {byCategory.length > 0 && (
                  <PaginationControls
                    page={reportsPage}
                    setPage={setReportsPage}
                    pageSize={reportsPageSize}
                    totalItems={byCategory.length}
                  />
                )}
              </Panel>
            </div>

            <div className="col-span-12 lg:col-span-5">
              <Panel>
                <PanelHeader>
                  <div>
                    <PanelTitle>Share of spend</PanelTitle>
                  </div>
                </PanelHeader>
                {donut.length > 0 ? (
                  <div className="px-4 py-4">
                    <DonutChart
                      segments={donut}
                      size={170}
                      thickness={18}
                      centerLabel="Total"
                      centerValue={formatCompact(total, currency)}
                      className="items-start"
                    />
                  </div>
                ) : (
                  <EmptyState
                    title="No share data"
                    description="No category share was returned."
                    className="py-8"
                  />
                )}
              </Panel>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryMetric({ label, value, helper }) {
  return (
    <div className="rounded-lg border border-rule bg-paper px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-ink-muted">{label}</p>
        <div className="h-6 w-6 rounded-full bg-paper-deep" aria-hidden />
      </div>
      <p className="mt-2 break-words text-xl font-semibold text-ink">{value}</p>
      {helper ? (
        <p className="mt-1 text-xs text-ink-muted leading-snug">{helper}</p>
      ) : (
        <div className="mt-1 h-3" aria-hidden />
      )}
    </div>
  );
}
