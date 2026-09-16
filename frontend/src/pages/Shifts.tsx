import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getMyShifts, getAllShifts } from "../api/shift";
import { downloadShiftReportPdf } from "../api/reports";
import { useToast } from "../context/ToastContext";
import { Download } from "lucide-react";

function Shifts() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [myStatus, setMyStatus] = useState("all");
  const [allStatus, setAllStatus] = useState("all");
  const [staffSearch, setStaffSearch] = useState("");
  const [downloadingShiftId, setDownloadingShiftId] = useState<number | null>(null);
  const { showToast } = useToast();

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

  const filteredMyShifts = myShifts.filter((shift) => myStatus === "all" || shift.status === myStatus);
  const filteredAllShifts = allShifts.filter((shift) => {
    const matchesStatus = allStatus === "all" || shift.status === allStatus;
    const matchesStaff = !staffSearch.trim() || shift.user_name.toLowerCase().includes(staffSearch.trim().toLowerCase());
    return matchesStatus && matchesStaff;
  });

  const handleDownload = async (shiftId: number) => {
    setDownloadingShiftId(shiftId);
    try {
      const blob = await downloadShiftReportPdf(shiftId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shift-report-${shiftId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      showToast("Shift report downloaded.", "success");
    } catch (error: any) {
      showToast(error?.response?.data?.detail ?? "Could not download shift report.", "error");
    } finally {
      setDownloadingShiftId(null);
    }
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

        <div className="mb-4">
          <select value={myStatus} onChange={(event) => setMyStatus(event.target.value)} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink">
            <option value="all">All my shifts</option><option value="open">Open</option><option value="closed">Closed</option>
          </select>
        </div>

        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {loadingMine ? (
            <div className="p-8 text-center text-ink-muted text-sm">Loading shifts...</div>
          ) : filteredMyShifts.length === 0 ? (
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
                  <th className="px-6 py-3 font-medium text-ink-muted">Report</th>
                </tr>
              </thead>
              <tbody>
                {filteredMyShifts.map((shift) => (
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
                    <td className="px-6 py-3">
                      <button type="button" onClick={() => handleDownload(shift.shift_id)} disabled={downloadingShiftId === shift.shift_id} title="Download shift report" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50">
                        <Download size={14} /> {downloadingShiftId === shift.shift_id ? "Downloading..." : "PDF"}
                      </button>
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

          <div className="mb-4 flex flex-wrap gap-3">
            <input value={staffSearch} onChange={(event) => setStaffSearch(event.target.value)} placeholder="Search staff member..." className="min-w-56 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/40" />
            <select value={allStatus} onChange={(event) => setAllStatus(event.target.value)} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink">
              <option value="all">All staff shifts</option><option value="open">Open</option><option value="closed">Closed</option>
            </select>
          </div>

          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            {loadingAll ? (
              <div className="p-8 text-center text-ink-muted text-sm">Loading all shifts...</div>
            ) : filteredAllShifts.length === 0 ? (
              <div className="p-8 text-center text-ink-muted text-sm">No shifts recorded yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg text-left">
                    <th className="px-6 py-3 font-medium text-ink-muted">User</th>
                    <th className="px-6 py-3 font-medium text-ink-muted">Opened</th>
                    <th className="px-6 py-3 font-medium text-ink-muted">Closed</th>
                    <th className="px-6 py-3 font-medium text-ink-muted">Duration</th>
                    <th className="px-6 py-3 font-medium text-ink-muted text-right">Sales</th>
                    <th className="px-6 py-3 font-medium text-ink-muted text-right">Revenue</th>
                    <th className="px-6 py-3 font-medium text-ink-muted">Status</th>
                    <th className="px-6 py-3 font-medium text-ink-muted">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllShifts.map((shift) => (
                    <tr key={shift.shift_id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                      <td className="px-6 py-3 text-ink">{shift.user_name}</td>
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
                      <td className="px-6 py-3">
                        <button type="button" onClick={() => handleDownload(shift.shift_id)} disabled={downloadingShiftId === shift.shift_id} title="Download shift report" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50">
                          <Download size={14} /> {downloadingShiftId === shift.shift_id ? "Downloading..." : "PDF"}
                        </button>
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