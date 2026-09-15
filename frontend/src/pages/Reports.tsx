import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSalesSummary } from "../api/reports";

function Reports() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [appliedStart, setAppliedStart] = useState(thirtyDaysAgo);
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

  const maxRevenue = data?.top_medicines.length
    ? Math.max(...data.top_medicines.map((m) => m.total_revenue))
    : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-ink">Reports</h1>
        <p className="text-ink-muted text-sm mt-1">
          Sales summary and top-performing medicines.
        </p>
      </div>

      {/* Date range filter */}
      <div className="bg-surface border border-border rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1">
            From
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1">
            To
          </label>
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

      {isLoading ? (
        <div className="p-8 text-center text-ink-muted text-sm">
          Loading report...
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
              <p className="font-display font-bold text-3xl text-ink">
                {data.total_sales}
              </p>
              <p className="text-xs text-ink-muted mt-1">
                Completed transactions
              </p>
            </div>

            <div className="bg-surface border border-border rounded-lg p-5">
              <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
                Total revenue
              </p>
              <p className="font-display font-bold text-3xl text-ink">
                GH₵{data.total_revenue.toFixed(2)}
              </p>
              <p className="text-xs text-ink-muted mt-1">
                Voided sales excluded
              </p>
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
              <p className="text-xs text-ink-muted mt-1">
                Revenue ÷ transactions
              </p>
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
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-ink">
                Top medicines by revenue
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Up to 10 best-selling medicines in the selected period
              </p>
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