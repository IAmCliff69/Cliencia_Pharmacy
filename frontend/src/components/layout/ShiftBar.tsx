import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getActiveShift, openShift, closeShift } from "../../api/shift";
import { useState } from "react";
import type { ShiftSummaryResponse } from "../../types/shift";
import { useToast } from "../../context/ToastContext";

function ShiftBar() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [closedSummary, setClosedSummary] = useState<ShiftSummaryResponse | null>(null);

  const { data: activeShift, isLoading } = useQuery({
    queryKey: ["active-shift"],
    queryFn: async () => {
      try {
        return await getActiveShift();
      } catch (err: any) {
        // 404 = no active shift — valid state, not a real error
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
    retry: false,
  });

  const openMutation = useMutation({
    mutationFn: openShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-shift"] });
      setClosedSummary(null);
      showToast("Shift opened.", "success");
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.detail ?? "Failed to open shift.", "error");
    },
  });

  const closeMutation = useMutation({
    mutationFn: closeShift,
    onSuccess: (summary) => {
      queryClient.invalidateQueries({ queryKey: ["active-shift"] });
      queryClient.invalidateQueries({ queryKey: ["my-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["all-shifts"] });
      setClosedSummary(summary);
      showToast("Shift closed.", "success");
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.detail ?? "Failed to close shift.", "error");
    },
  });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) return null;

  const hasActiveShift = !!activeShift;

  return (
    <>
      <div className="flex min-h-12 items-center justify-between gap-4 bg-surface/70 px-6 py-2 text-xs shadow-[0_1px_0_rgba(21,56,70,0.04)] backdrop-blur-sm sm:px-8">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${hasActiveShift ? "bg-green-500" : "bg-yellow-500"}`} />
          {hasActiveShift ? (
            <span className="text-green-700">
              Shift open since{" "}
              <span className="font-medium">{formatTime(activeShift!.opened_at)}</span>
            </span>
          ) : (
            <span className="text-yellow-700">
              No active shift — open one to start making sales
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {hasActiveShift ? (
            <button
              onClick={() => closeMutation.mutate()}
              disabled={closeMutation.isPending}
              className="rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/20 disabled:opacity-50"
            >
              {closeMutation.isPending ? "Closing..." : "Close shift"}
            </button>
          ) : (
            <button
              onClick={() => openMutation.mutate()}
              disabled={openMutation.isPending}
              className="rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-500/20 disabled:opacity-50"
            >
              {openMutation.isPending ? "Opening..." : "Open shift"}
            </button>
          )}
        </div>
      </div>

      {closedSummary && (
        <div className="flex items-center justify-between gap-4 bg-surface/70 px-6 py-3 text-sm sm:px-8">
          <span className="text-blue-700">
            Shift closed —{" "}
            <span className="font-medium">
              {closedSummary.total_sales} sale{closedSummary.total_sales !== 1 ? "s" : ""}
            </span>{" "}
            totalling{" "}
            <span className="font-medium">GH₵{closedSummary.total_revenue.toFixed(2)}</span>{" "}
            for this session.
          </span>
          <button
            onClick={() => setClosedSummary(null)}
            className="text-blue-400 hover:text-blue-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

export default ShiftBar;