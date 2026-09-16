import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getMyShifts, getAllShifts } from "../api/shift";

function Shifts() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: myShifts = [], isLoading: loadingMine } = useQuery({
    queryKey: ["my-shifts"],
    queryFn: getMyShifts,
  });

  const { data: allShifts = [], isLoading: loadingAll } = useQuery({
    queryKey: ["all-shifts"],
    queryFn: getAllShifts,
    enabled: isAdmin,
  });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDuration = (opened: string, closed: string | null) => {
    if (!closed) return "Still open";
    const ms = new Date(closed).getTime() - new Date(opened).getTime();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-4">
          <h1 className="font-display font-bold text-2xl text-ink">My Shifts</h1>
          <p className="text-ink-muted text-sm mt-1">
            Your personal shift history and sales totals per session.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {loadingMine ? (
            <div className="p-8 text-center text-ink-muted text-sm">Loading shifts...</div>
          ) : myShifts.length === 0 ? (
            <div className="p-8 text-center text-ink-muted text-sm">
              No shifts yet — open your first shift from the bar at the top.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg text-left">
                  <th className="px-6 py-3 font-medium text-ink-muted">Opened</th>
                  <th className="px-6 py-3 font-medium text-ink-muted">Closed</th>
                  <th className="px-6 py-3 font-medium text-ink-muted">Duration</th>
                  <th className="px-6 py-3 font-medium text-ink-muted text-right">Sales</th>
                  <th className="px-6 py-3 font-medium text-ink-muted text-right">Revenue</th>
                  <th className="px-6 py-3 font-medium text-ink-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {myShifts.map((shift) => (
                  <tr key={shift.shift_id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                    <td className="px-6 py-3 text-ink">{formatDateTime(shift.opened_at)}</td>
                    <td className="px-6 py-3 text-ink-muted">
                      {shift.closed_at ? formatDateTime(shift.closed_at) : "—"}
                    </td>
                    <td className="px-6 py-3 text-ink-muted">
                      {formatDuration(shift.opened_at, shift.closed_at)}
                    </td>
                    <td className="px-6 py-3 text-ink font-medium text-right">{shift.total_sales}</td>
                    <td className="px-6 py-3 text-ink font-medium text-right">
                      GH₵{shift.total_revenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        shift.status === "open"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                        {shift.status === "open" ? "Open" : "Closed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isAdmin && (
        <div>
          <div className="mb-4">
            <h2 className="font-display font-bold text-xl text-ink">All Staff Shifts</h2>
            <p className="text-ink-muted text-sm mt-1">
              Every shift across all staff members, newest first.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            {loadingAll ? (
              <div className="p-8 text-center text-ink-muted text-sm">Loading all shifts...</div>
            ) : allShifts.length === 0 ? (
              <div className="p-8 text-center text-ink-muted text-sm">No shifts recorded yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg text-left">
                    <th className="px-6 py-3 font-medium text-ink-muted">User ID</th>
                    <th className="px-6 py-3 font-medium text-ink-muted">Opened</th>
                    <th className="px-6 py-3 font-medium text-ink-muted">Closed</th>
                    <th className="px-6 py-3 font-medium text-ink-muted">Duration</th>
                    <th className="px-6 py-3 font-medium text-ink-muted text-right">Sales</th>
                    <th className="px-6 py-3 font-medium text-ink-muted text-right">Revenue</th>
                    <th className="px-6 py-3 font-medium text-ink-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allShifts.map((shift) => (
                    <tr key={shift.shift_id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                      <td className="px-6 py-3 text-ink-muted">#{shift.user_id}</td>
                      <td className="px-6 py-3 text-ink">{formatDateTime(shift.opened_at)}</td>
                      <td className="px-6 py-3 text-ink-muted">
                        {shift.closed_at ? formatDateTime(shift.closed_at) : "—"}
                      </td>
                      <td className="px-6 py-3 text-ink-muted">
                        {formatDuration(shift.opened_at, shift.closed_at)}
                      </td>
                      <td className="px-6 py-3 text-ink font-medium text-right">{shift.total_sales}</td>
                      <td className="px-6 py-3 text-ink font-medium text-right">
                        GH₵{shift.total_revenue.toFixed(2)}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          shift.status === "open"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}>
                          {shift.status === "open" ? "Open" : "Closed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Shifts;