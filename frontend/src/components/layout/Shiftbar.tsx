import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getActiveShift, openShift, closeShift } from "../../api/shift";
import { useState } from "react";
import type { ShiftSummaryResponse } from "../../types/shift";

function ShiftBar() {
  const queryClient = useQueryClient();
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
    },
  });

  const closeMutation = useMutation({
    mutationFn: closeShift,
    onSuccess: (summary) => {
      queryClient.invalidateQueries({ queryKey: ["active-shift"] });
      queryClient.invalidateQueries({ queryKey: ["my-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["all-shifts"] });
      setClosedSummary(summary);
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
      <div className={`px-8 py-2.5 flex items-center justify-between text-xs border-b ${
        hasActiveShift ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
      }`}>
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

        <div className="flex items-center gap-3">
          {hasActiveShift ? (
            <button
              onClick={() => closeMutation.mutate()}
              disabled={closeMutation.isPending}
              className="text-xs font-medium px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {closeMutation.isPending ? "Closing..." : "Close shift"}
            </button>
          ) : (
            <button
              onClick={() => openMutation.mutate()}
              disabled={openMutation.isPending}
              className="text-xs font-medium px-3 py-1 rounded border border-green-300 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              {openMutation.isPending ? "Opening..." : "Open shift"}
            </button>
          )}
        </div>
      </div>

      {closedSummary && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between text-sm">
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