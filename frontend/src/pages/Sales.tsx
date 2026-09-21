import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSales, voidSale } from "../api/sales";
import { listUsers } from "../api/auth";
import { getMedicines } from "../api/medicines";
import type { SaleResponse } from "../types/sale";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { SkeletonTable } from "../components/Skeleton";


function Sales() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedSale, setSelectedSale] = useState<SaleResponse | null>(null);
  const [voidTarget, setVoidTarget] = useState<SaleResponse | null>(null);
  const [voidError, setVoidError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const { data: sales = [], isLoading, isError } = useQuery({
    queryKey: ["sales"],
    queryFn: getSales,
  });

  const { data: medicines = [] } = useQuery({
  queryKey: ["medicines"],
  queryFn: () => getMedicines({}),
});

const { data: users = [] } = useQuery({
  queryKey: ["users"],
  queryFn: listUsers,
  enabled: isAdmin,
});

  const medicineMap = Object.fromEntries(
  medicines.map((m) => [m.medicine_id, m.medicine_name])
);

const userMap = Object.fromEntries(
  users.map((u) => [u.user_id, `${u.first_name} ${u.last_name}`])
);

  const filteredSales = sales.filter((sale) => {
    const value = search.trim().toLowerCase();
    const matchesSearch = !value || String(sale.sale_id).includes(value) || (sale.customer_name ?? "walk-in").toLowerCase().includes(value);
    const matchesStatus = statusFilter === "all" || (sale.is_voided ? "voided" : "completed") === statusFilter;
    const matchesDate = !dateFilter || sale.sale_date.startsWith(dateFilter);
    return matchesSearch && matchesStatus && matchesDate;
  });

  const voidMutation = useMutation({
    mutationFn: (saleId: number) => voidSale(saleId),
    onSuccess: (updatedSale) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setVoidTarget(null);
      setVoidError(null);
      if (selectedSale?.sale_id === updatedSale.sale_id) {
        setSelectedSale(updatedSale);
      }
      showToast(`Sale #${updatedSale.sale_id} voided.`, "success");
    },
    onError: (err: any) => {
      setVoidError(
        err?.response?.data?.detail ?? "Failed to void sale."
      );
      showToast(err?.response?.data?.detail ?? "Failed to void sale.", "error");
    },
  });

  const handleVoid = (saleId: number) => {
    voidMutation.mutate(saleId);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-ink">
          Sales History
        </h1>
        <p className="text-ink-muted text-sm mt-1">
          {isAdmin
            ? "All staff sales. Admins can void sales to restore stock."
            : "Your completed sales only."}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sale number or customer..." className="min-w-56 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/40" />
        <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter sales by date" className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink">
          <option value="all">All statuses</option><option value="completed">Completed</option><option value="voided">Voided</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales list */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={6} cols={4} />
          ) : isError ? (
            <div className="p-8 text-center text-red-600 text-sm">
              Failed to load sales.
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-8 text-center text-ink-muted text-sm">
              No sales yet. Complete a sale in the Point of Sale screen.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filteredSales.map((sale) => (
                <li
                  key={sale.sale_id}
                  onClick={() => setSelectedSale(sale)}
                  className={`px-6 py-4 cursor-pointer hover:bg-bg transition-colors ${
                    selectedSale?.sale_id === sale.sale_id
                      ? "bg-bg border-l-2 border-primary"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink">
                      Sale #{sale.sale_id}
                    </span>
                    <span className="font-medium text-sm text-ink">
                      GH₵{sale.total_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ink-muted">
                      {sale.customer_name ?? "Walk-in"} ·{" "}
                      {formatDate(sale.sale_date)}
                    </span>
                    {sale.is_voided ? (
                      <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                        Voided
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sale detail */}
        <div>
          {selectedSale ? (
            <div className="bg-surface border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-display font-bold text-lg text-ink">
                    Sale #{selectedSale.sale_id}
                  </h2>
                  <p className="text-ink-muted text-sm">
                    {formatDate(selectedSale.sale_date)}
                  </p>
                </div>
                {selectedSale.is_voided && (
                  <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-2 py-1 rounded-full">
                    Voided
                  </span>
                )}
              </div>

              {selectedSale.customer_name && (
                <p className="text-sm text-ink-muted mb-4">
                  Customer:{" "}
                  <span className="text-ink font-medium">
                    {selectedSale.customer_name}
                  </span>
                </p>
              )}

              {isAdmin && (
                <p className="text-sm text-ink-muted mb-2">
                Served by:{" "}
                <span className="text-ink font-medium">
                    {userMap[selectedSale.user_id] ?? `Staff #${selectedSale.user_id}`}
                </span>
                 </p>
             )}

                {selectedSale.customer_name && (
                    <p className="text-sm text-ink-muted mb-4">
                        Customer:{" "}
                        <span className="text-ink font-medium">
                            {selectedSale.customer_name}
                         </span>
                    </p>
                )}

              

              <div className="space-y-2 mb-4">
                {selectedSale.items.map((item) => (
                  <div
                    key={item.sale_item_id}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-ink-muted">
                      {medicineMap[item.medicine_id] ??
                        `Medicine #${item.medicine_id}`}{" "}
                      × {item.quantity}
                    </span>
                    <span className="text-ink font-medium">
                      GH₵{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 flex justify-between text-sm font-bold text-ink mb-6">
                <span>Total</span>
                <span>GH₵{selectedSale.total_amount.toFixed(2)}</span>
              </div>

              {selectedSale.is_voided && selectedSale.voided_at && (
                <p className="text-xs text-ink-muted mb-4">
                  Voided on {formatDate(selectedSale.voided_at)}
                </p>
              )}

              {isAdmin && !selectedSale.is_voided && (
                <button
                  onClick={() => setVoidTarget(selectedSale)}
                  className="w-full border border-red-200 text-red-600 text-sm font-medium py-2 rounded-md hover:bg-red-50 transition-colors"
                >
                  Void this sale
                </button>
              )}
            </div>
          ) : (
            <div className="bg-surface border border-dashed border-border rounded-lg p-8 text-center text-ink-muted text-sm">
              Select a sale from the list to view its details
            </div>
          )}
        </div>
      </div>

      {/* Void confirmation modal */}
      {voidTarget !== null && (
        <VoidConfirmModal
          saleId={voidTarget.sale_id}
          onConfirm={handleVoid}
          onCancel={() => {
            setVoidTarget(null);
            setVoidError(null);
          }}
          isVoiding={voidMutation.isPending}
          error={voidError}
        />
      )}
    </div>
  );
}

// -----------------------------
// Void confirmation modal
// -----------------------------
function VoidConfirmModal({
  saleId,
  onConfirm,
  onCancel,
  isVoiding,
  error,
}: {
  saleId: number;
  onConfirm: (id: number) => void;
  onCancel: () => void;
  isVoiding: boolean;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-lg w-full max-w-sm p-6">
        <h2 className="font-display font-bold text-lg text-ink mb-2">
          Void Sale #{saleId}?
        </h2>
        <p className="text-sm text-ink-muted mb-4">
          Voiding this sale will restore stock for all items and mark it as
          voided. The record is kept for audit purposes and cannot be
          undone.
        </p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(saleId)}
            disabled={isVoiding}
            className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {isVoiding ? "Voiding..." : "Void sale"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sales;