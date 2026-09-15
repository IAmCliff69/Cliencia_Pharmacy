import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listUsers,
  promoteToAdmin,
  deactivateUser,
  reactivateUser,
} from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

function Users() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  const promoteMutation = useMutation({
    mutationFn: (userId: number) => promoteToAdmin(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setActionError(null);
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
    },
    onError: (err: any) => {
      setActionError(
        err?.response?.data?.detail ?? "Failed to deactivate user."
      );
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (userId: number) => reactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(
        err?.response?.data?.detail ?? "Failed to reactivate user."
      );
    },
  });

  const isActioning =
    promoteMutation.isPending ||
    deactivateMutation.isPending ||
    reactivateMutation.isPending;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-ink">Users</h1>
        <p className="text-ink-muted text-sm mt-1">
          Manage staff accounts, roles, and access.
        </p>
      </div>

      {actionError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-3">
          {actionError}
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-ink-muted text-sm">
            Loading users...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-600 text-sm">
            Failed to load users.
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-ink-muted text-sm">
            No users found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left">
                <th className="px-6 py-3 font-medium text-ink-muted">Name</th>
                <th className="px-6 py-3 font-medium text-ink-muted">Email</th>
                <th className="px-6 py-3 font-medium text-ink-muted">Role</th>
                <th className="px-6 py-3 font-medium text-ink-muted">Status</th>
                <th className="px-6 py-3 font-medium text-ink-muted w-48">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.user_id === currentUser?.user_id;
                return (
                  <tr
                    key={u.user_id}
                    className="border-b border-border last:border-0 hover:bg-bg transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-ink">
                      {u.first_name} {u.last_name}
                      {isSelf && (
                        <span className="ml-2 text-xs text-ink-muted font-normal">
                          (you)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-ink-muted">{u.email}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          u.role === "admin"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-bg text-ink-muted border-border"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          u.is_active
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-red-100 text-red-600 border-red-200"
                        }`}
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-3 flex-wrap">
                        {/* Promote — only for active staff, not self */}
                        {u.role === "staff" && u.is_active && !isSelf && (
                          <button
                            onClick={() => promoteMutation.mutate(u.user_id)}
                            disabled={isActioning}
                            className="text-primary hover:underline text-xs disabled:opacity-50"
                          >
                            Promote
                          </button>
                        )}

                        {/* Deactivate — only for active users, not self */}
                        {u.is_active && !isSelf && (
                          <button
                            onClick={() =>
                              deactivateMutation.mutate(u.user_id)
                            }
                            disabled={isActioning}
                            className="text-red-600 hover:underline text-xs disabled:opacity-50"
                          >
                            Deactivate
                          </button>
                        )}

                        {/* Reactivate — only for inactive users */}
                        {!u.is_active && (
                          <button
                            onClick={() =>
                              reactivateMutation.mutate(u.user_id)
                            }
                            disabled={isActioning}
                            className="text-green-600 hover:underline text-xs disabled:opacity-50"
                          >
                            Reactivate
                          </button>
                        )}

                        {/* Self — no actions */}
                        {isSelf && (
                          <span className="text-xs text-ink-muted">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Users;