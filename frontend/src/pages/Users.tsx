import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listUsers,
  getPendingUsers,
  approveUser,
  rejectUser,
  promoteToAdmin,
  deactivateUser,
  reactivateUser,
} from "../api/auth";
import { getAllShifts } from "../api/shift";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../context/ToastContext";
import { SkeletonTable } from "../components/Skeleton";

function Users() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [shiftSearch, setShiftSearch] = useState("");
  const [shiftStatusFilter, setShiftStatusFilter] = useState("all");
  const [deactivateTarget, setDeactivateTarget] = useState<{ userId: number; name: string } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ userId: number; name: string } | null>(null);
  const { showToast } = useToast();

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  const { data: pendingUsers = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["pending-users"],
    queryFn: getPendingUsers,
  });

  const { data: allShifts = [], isLoading: shiftsLoading, isError: shiftsError } = useQuery({
    queryKey: ["all-shifts"],
    queryFn: () => getAllShifts({ limit: 100 }),
  });

  const approveMutation = useMutation({
    mutationFn: (userId: number) => approveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast("User approved and can now log in.", "success");
    },
    onError: (err: any) => {
      setActionError(err?.response?.data?.detail ?? "Failed to approve user.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: number) => rejectUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setRejectTarget(null);
      setActionError(null);
      showToast("User registration rejected.", "success");
    },
    onError: (err: any) => {
      setActionError(err?.response?.data?.detail ?? "Failed to reject user.");
    },
  });

  const promoteMutation = useMutation({
    mutationFn: (userId: number) => promoteToAdmin(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setActionError(null);
      showToast("User promoted to admin.", "success");
    },
    onError: (err: any) => {
      setActionError(err?.response?.data?.detail ?? "Failed to promote user.");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: number) => deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setActionError(null);
      setDeactivateTarget(null);
      showToast("User deactivated.", "success");
    },
    onError: (err: any) => {
      setActionError(err?.response?.data?.detail ?? "Failed to deactivate user.");
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (userId: number) => reactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setActionError(null);
      showToast("User reactivated.", "success");
    },
    onError: (err: any) => {
      setActionError(err?.response?.data?.detail ?? "Failed to reactivate user.");
    },
  });

  const isActioning =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    promoteMutation.isPending ||
    deactivateMutation.isPending ||
    reactivateMutation.isPending;

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const formatDuration = (opened: string, closed: string | null) => {
    if (!closed) return "Still open";
    const ms = new Date(closed).getTime() - new Date(opened).getTime();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const filteredUsers = users.filter((candidate) => {
    const search = userSearch.trim().toLowerCase();
    const matchesSearch = !search || `${candidate.first_name} ${candidate.last_name} ${candidate.email}`.toLowerCase().includes(search);
    const matchesRole = roleFilter === "all" || candidate.role === roleFilter;
    const matchesStatus = statusFilter === "all" || (candidate.is_active ? "active" : "inactive") === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredShifts = allShifts.filter((shift) => {
    const matchesSearch = !shiftSearch.trim() || shift.user_name.toLowerCase().includes(shiftSearch.trim().toLowerCase());
    const matchesStatus = shiftStatusFilter === "all" || shift.status === shiftStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-ink">Users</h1>
        <p className="text-ink-muted text-sm mt-1">
          Manage staff accounts, roles, and access.
        </p>
      </div>

      {/* Pending approval section */}
      {!pendingLoading && pendingUsers.length > 0 && (
        <div className="mb-6 bg-surface border border-warning/40 rounded-lg overflow-hidden">
          <div className="px-6 py-3 border-b border-border flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-warning shrink-0" />
            <h2 className="font-display font-semibold text-ink text-sm">
              Pending approval
            </h2>
            <span className="text-xs text-ink-muted">
              {pendingUsers.length} account{pendingUsers.length !== 1 ? "s" : ""} awaiting activation
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left">
                <th className="px-6 py-3 font-medium text-ink-muted">Name</th>
                <th className="px-6 py-3 font-medium text-ink-muted">Email</th>
                <th className="px-6 py-3 font-medium text-ink-muted">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((u) => (
                <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                  <td className="px-6 py-3 font-medium text-ink">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="px-6 py-3 text-ink-muted">{u.email}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => approveMutation.mutate(u.user_id)}
                      disabled={isActioning}
                      className="text-xs font-medium text-success hover:underline disabled:opacity-50"
                    >
                      {approveMutation.isPending ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => setRejectTarget({ userId: u.user_id, name: `${u.first_name} ${u.last_name}` })}
                      disabled={isActioning}
                      className="ml-3 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {actionError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-3">
          {actionError}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search users..." className="min-w-56 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/40" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink">
          <option value="all">All roles</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={6} cols={4} />
        ) : isError ? (
          <div className="p-8 text-center text-red-600 text-sm">Failed to load users.</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-ink-muted text-sm">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left">
                <th className="px-6 py-3 font-medium text-ink-muted">Name</th>
                <th className="px-6 py-3 font-medium text-ink-muted">Email</th>
                <th className="px-6 py-3 font-medium text-ink-muted">Role</th>
                <th className="px-6 py-3 font-medium text-ink-muted">Status</th>
                <th className="px-6 py-3 font-medium text-ink-muted w-48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isSelf = u.user_id === currentUser?.user_id;
                return (
                  <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                    <td className="px-6 py-3 font-medium text-ink">
                      {u.first_name} {u.last_name}
                      {isSelf && <span className="ml-2 text-xs text-ink-muted font-normal">(you)</span>}
                    </td>
                    <td className="px-6 py-3 text-ink-muted">{u.email}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        u.role === "admin"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-bg text-ink-muted border-border"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        u.is_active
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-red-100 text-red-600 border-red-200"
                      }`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-3 flex-wrap">
                        {u.role === "staff" && u.is_active && !isSelf && (
                          <button onClick={() => promoteMutation.mutate(u.user_id)} disabled={isActioning} className="text-primary hover:underline text-xs disabled:opacity-50">
                            Promote
                          </button>
                        )}
                        {u.is_active && !isSelf && (
                          <button onClick={() => setDeactivateTarget({ userId: u.user_id, name: `${u.first_name} ${u.last_name}` })} disabled={isActioning} className="text-red-600 hover:underline text-xs disabled:opacity-50">
                            Deactivate
                          </button>
                        )}
                        {!u.is_active && (
                          <button onClick={() => reactivateMutation.mutate(u.user_id)} disabled={isActioning} className="text-green-600 hover:underline text-xs disabled:opacity-50">
                            Reactivate
                          </button>
                        )}
                        {isSelf && <span className="text-xs text-ink-muted">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="font-display font-bold text-xl text-ink">Staff Shift Activity</h2>
          <p className="text-ink-muted text-sm mt-1">View every shift opened and closed by staff members.</p>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <input value={shiftSearch} onChange={(e) => setShiftSearch(e.target.value)} placeholder="Search by staff member..." className="min-w-56 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/40" />
          <select value={shiftStatusFilter} onChange={(e) => setShiftStatusFilter(e.target.value)} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink">
            <option value="all">All shift statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {shiftsLoading ? (
            <div className="p-8 text-center text-ink-muted text-sm">Loading shifts...</div>
          ) : shiftsError ? (
            <div className="p-8 text-center text-red-600 text-sm">Failed to load staff shifts.</div>
          ) : filteredShifts.length === 0 ? (
            <div className="p-8 text-center text-ink-muted text-sm">No staff shifts recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg text-left">
                    <th className="px-6 py-3 font-medium text-ink-muted">Staff member</th>
                    <th className="px-6 py-3 font-medium text-ink-muted">Opened</th>
                    <th className="px-6 py-3 font-medium text-ink-muted">Closed</th>
                    <th className="px-6 py-3 font-medium text-ink-muted">Duration</th>
                    <th className="px-6 py-3 font-medium text-ink-muted">Status</th>
                    <th className="px-6 py-3 font-medium text-ink-muted text-right">Sales</th>
                    <th className="px-6 py-3 font-medium text-ink-muted text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShifts.map((shift) => (
                    <tr key={shift.shift_id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                      <td className="px-6 py-3 font-medium text-ink">{shift.user_name}</td>
                      <td className="px-6 py-3 text-ink">{formatDateTime(shift.opened_at)}</td>
                      <td className="px-6 py-3 text-ink-muted">{shift.closed_at ? formatDateTime(shift.closed_at) : "—"}</td>
                      <td className="px-6 py-3 text-ink-muted">{formatDuration(shift.opened_at, shift.closed_at)}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          shift.status === "open"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}>
                          {shift.status === "open" ? "Open" : "Closed"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-ink font-medium text-right">{shift.total_sales}</td>
                      <td className="px-6 py-3 text-ink font-medium text-right">GH₵{shift.total_revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {deactivateTarget && (
        <ConfirmDialog
          title="Deactivate this user?"
          message={`${deactivateTarget.name} will lose access immediately, but their sales and shift history will be preserved.`}
          confirmLabel="Deactivate"
          onConfirm={() => deactivateMutation.mutate(deactivateTarget.userId)}
          onCancel={() => setDeactivateTarget(null)}
          isPending={deactivateMutation.isPending}
        />
      )}

      {rejectTarget && (
        <ConfirmDialog
          title="Reject this registration?"
          message={`${rejectTarget.name}'s pending account will be permanently removed and they will not be able to log in.`}
          confirmLabel="Reject"
          onConfirm={() => rejectMutation.mutate(rejectTarget.userId)}
          onCancel={() => setRejectTarget(null)}
          isPending={rejectMutation.isPending}
        />
      )}
    </div>
  );
}

export default Users;