import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSalesSummary, downloadSalesReportPdf } from "../api/reports";
import { Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { SkeletonCard } from "../components/Skeleton";

const getDateString = (date: Date) => date.toISOString().split("T")[0];
const getDateDaysAgo = (days: number) =>
  getDateString(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

function Reports() {
  const { user } = useAuth();
  const isAdmin = user?.role.trim().toLowerCase() === "admin";
  const [today] = useState(() => getDateString(new Date()));
  const [thirtyDaysAgo] = useState(() => getDateDaysAgo(30));

  const [startDate, setStartDate] = useState(isAdmin ? today : thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [appliedStart, setAppliedStart] = useState(isAdmin ? today : thirtyDaysAgo);
  const [appliedEnd, setAppliedEnd] = useState(today);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["sales-summary", appliedStart, appliedEnd],
    queryFn: () =>
      getSalesSummary({
        start_date: appliedStart || undefined,
        end_date: appliedEnd || undefined,
      }),
  });

  const handleApply = () => {
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setAppliedStart("");
    setAppliedEnd("");
  };

  const applyPreset = (days: number | null) => {
    if (days === null) {
      handleClear();
      return;
    }
    const start = getDateDaysAgo(days);
    setStartDate(start);
    setEndDate(today);
    setAppliedStart(start);
    setAppliedEnd(today);
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["Medicine", "Quantity sold", "Revenue"],
      ...data.top_medicines.map((medicine) => [
        medicine.medicine_name,
        String(medicine.total_quantity_sold),
        medicine.total_revenue.toFixed(2),
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-report-${appliedStart || "all-time"}-${appliedEnd || "all-time"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    const blob = await downloadSalesReportPdf({
      start_date: appliedStart || undefined,
      end_date: appliedEnd || undefined,
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-report-${appliedStart || "today"}-${appliedEnd || "today"}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadTodayTotal = async () => {
    const blob = await downloadSalesReportPdf({
      start_date: today,
      end_date: today,
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `all-users-sales-report-${today}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const maxRevenue = data?.top_medicines.length
    ? Math.max(...data.top_medicines.map((m) => m.total_revenue))
    : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-ink">Reports</h1>
        <p className="text-ink-muted text-sm mt-1">
          {isAdmin
            ? "All staff and admin sales for the selected period."
            : "Your sales and top-performing medicines."}
        </p>
      </div>

      {/* Date range filter */}
      <div className="bg-surface border border-border rounded-lg p-4 mb-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Today", days: 0 },
            { label: "Last 7 days", days: 7 },
            { label: "Last 30 days", days: 30 },
            { label: "All time", days: null },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.days)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-primary hover:text-primary"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            onClick={handleApply}
            className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
          >
            Apply
          </button>
          <button
            onClick={handleClear}
            className="text-sm text-ink-muted hover:text-ink transition-colors px-2 py-2"
          >
            Clear (all time)
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-border/60" />
                  <div className="h-3 w-20 animate-pulse rounded bg-border/60" />
                </div>
                <div className="h-2 w-full animate-pulse rounded-full bg-border/60" />
              </div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-red-600 text-sm">
          Failed to load report. Please try again.
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-lg p-5">
              <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
                Total sales
              </p>
              <p className="font-display font-bold text-3xl text-ink">{data.total_sales}</p>
              <p className="text-xs text-ink-muted mt-1">Completed transactions</p>
            </div>

            <div className="bg-surface border border-border rounded-lg p-5">
              <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
                Total revenue
              </p>
              <p className="font-display font-bold text-3xl text-ink">
                GH₵{data.total_revenue.toFixed(2)}
              </p>
              <p className="text-xs text-ink-muted mt-1">Voided sales excluded</p>
            </div>

            <div className="bg-surface border border-border rounded-lg p-5">
              <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
                Avg per sale
              </p>
              <p className="font-display font-bold text-3xl text-ink">
                GH₵
                {data.total_sales > 0
                  ? (data.total_revenue / data.total_sales).toFixed(2)
                  : "0.00"}
              </p>
              <p className="text-xs text-ink-muted mt-1">Revenue ÷ transactions</p>
            </div>
          </div>

          {/* Date range label */}
          <p className="text-xs text-ink-muted">
            {appliedStart && appliedEnd
              ? `Showing data from ${appliedStart} to ${appliedEnd}`
              : appliedStart
              ? `Showing data from ${appliedStart}`
              : appliedEnd
              ? `Showing data up to ${appliedEnd}`
              : "Showing all-time data"}
          </p>

          {/* Top medicines */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-display font-semibold text-ink">
                  Top medicines by revenue
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Up to 10 best-selling medicines in the selected period
                </p>
              </div>
              <button
                type="button"
                onClick={downloadPdf}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-ink-muted hover:border-primary hover:text-primary"
              >
                <Download size={14} /> Download PDF
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={downloadTodayTotal}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary-dark"
                >
                  <Download size={14} /> Today&apos;s total PDF
                </button>
              )}
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-ink-muted hover:border-primary hover:text-primary"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>

            {data.top_medicines.length === 0 ? (
              <div className="p-8 text-center text-ink-muted text-sm">
                No sales data for this period.
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {data.top_medicines.map((medicine, index) => {
                  const barWidth =
                    maxRevenue > 0
                      ? (medicine.total_revenue / maxRevenue) * 100
                      : 0;
                  return (
                    <div key={medicine.medicine_id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-ink-muted w-5">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-ink">
                            {medicine.medicine_name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-ink">
                            GH₵{medicine.total_revenue.toFixed(2)}
                          </span>
                          <span className="text-xs text-ink-muted ml-2">
                            {medicine.total_quantity_sold} units
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-bg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Reports;