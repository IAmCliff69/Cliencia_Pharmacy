import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  adjustStock as adjustStockApi,
} from "../api/medicines";
import { getCategories } from "../api/categories";
import { getSuppliers } from "../api/suppliers";
import type { MedicineWithStockResponse, MedicineCreate } from "../types/medicine";
import type { CategoryResponse } from "../types/category";
import type { SupplierResponse } from "../types/supplier";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { SkeletonTable } from "../components/Skeleton";

// -----------------------------
// Helpers
// -----------------------------
function getStockStatus(medicine: MedicineWithStockResponse) {
  const today = new Date();
  const expiry = new Date(medicine.expiry_date);
  const daysToExpiry = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const qty = medicine.inventory?.quantity_available ?? 0;
  const minStock = medicine.inventory?.minimum_stock_level ?? 10;

  if (expiry < today) return "expired";
  if (daysToExpiry <= 30) return "expiring";
  if (qty <= minStock) return "low-stock";
  return "ok";
}

function getExpiryWarning(expiryDate: string) {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysToExpiry = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysToExpiry < 0) return "Expired";
  if (daysToExpiry <= 30) return `${daysToExpiry} day${daysToExpiry === 1 ? "" : "s"} left`;
  return null;
}

type StockStatus = "expired" | "expiring" | "low-stock" | "ok";

function StatusBadge({ status }: { status: StockStatus }) {
  const styles: Record<StockStatus, string> = {
    expired: "bg-red-100 text-red-700 border-red-200",
    expiring: "bg-yellow-100 text-yellow-700 border-yellow-200",
    "low-stock": "bg-yellow-100 text-yellow-700 border-yellow-200",
    ok: "bg-green-100 text-green-700 border-green-200",
  };
  const labels: Record<StockStatus, string> = {
    expired: "Expired",
    expiring: "Expiring soon",
    "low-stock": "Low stock",
    ok: "In stock",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

// -----------------------------
// Main page
// -----------------------------
function Medicines() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<number | undefined>();
  const [filterSupplier, setFilterSupplier] = useState<number | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] =
    useState<MedicineWithStockResponse | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<MedicineWithStockResponse | null>(null);
  const [stockTarget, setStockTarget] =
    useState<MedicineWithStockResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: medicines = [], isLoading, isError } = useQuery({
    queryKey: ["medicines", search, filterCategory, filterSupplier],
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    queryFn: () =>
      getMedicines({
        name: search || undefined,
        category_id: filterCategory,
        supplier_id: filterSupplier,
      }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

  const filterStatus = searchParams.get("status") ?? "";
const filteredMedicines = filterStatus
  ? medicines.filter((medicine) => {
      const today = new Date();
      const expiry = new Date(medicine.expiry_date);
      const daysToExpiry = Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      const qty = medicine.inventory?.quantity_available ?? 0;
      const minStock = medicine.inventory?.minimum_stock_level ?? 10;

      if (filterStatus === "expired") return expiry < today;
      if (filterStatus === "expiring") return daysToExpiry > 0 && daysToExpiry <= 30;
      if (filterStatus === "low-stock") return qty <= minStock;
      if (filterStatus === "ok") return expiry >= today && daysToExpiry > 30 && qty > minStock;
      return true;
    })
  : medicines;

  const createMutation = useMutation({
    mutationFn: createMedicine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      closeForm();
      showToast("Medicine created.", "success");
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail ?? "Failed to create medicine.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MedicineCreate }) =>
      updateMedicine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      closeForm();
      showToast("Medicine updated.", "success");
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail ?? "Failed to update medicine.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMedicine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      setDeleteTarget(null);
      showToast("Medicine deleted.", "success");
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.detail ?? "Failed to delete medicine.", "error");
    },
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, change }: { id: number; change: number }) =>
      adjustStockApi(id, change),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      setStockTarget(null);
      showToast("Stock updated.", "success");
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.detail ?? "Failed to update stock.", "error");
    },
  });

  const openAddForm = () => {
    setEditingMedicine(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (medicine: MedicineWithStockResponse) => {
    setEditingMedicine(medicine);
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingMedicine(null);
    setFormError(null);
  };

  const handleFormSubmit = (data: MedicineCreate) => {
    if (editingMedicine) {
      updateMutation.mutate({ id: editingMedicine.medicine_id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleStockAdjust = (id: number, change: number) => {
    stockMutation.mutate({ id, change });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const categoryMap = Object.fromEntries(
    categories.map((c) => [c.category_id, c.category_name])
  );
  const supplierMap = Object.fromEntries(
    suppliers.map((s) => [s.supplier_id, s.supplier_name])
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Medicines</h1>
          <p className="text-ink-muted text-sm mt-1">
            Full inventory with stock levels and expiry tracking.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddForm}
            className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
          >
            Add medicine
          </button>
        )}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-56"
        />
        <select
          value={filterCategory ?? ""}
          onChange={(e) =>
            setFilterCategory(
              e.target.value ? Number(e.target.value) : undefined
            )
          }
          className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.category_id} value={c.category_id}>
              {c.category_name}
            </option>
          ))}
        </select>
        <select
          value={filterSupplier ?? ""}
          onChange={(e) =>
            setFilterSupplier(
              e.target.value ? Number(e.target.value) : undefined
            )
          }
          className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All suppliers</option>
          {suppliers.map((s) => (
            <option key={s.supplier_id} value={s.supplier_id}>
              {s.supplier_name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => {
            const nextParams = new URLSearchParams(searchParams);
            if (e.target.value) nextParams.set("status", e.target.value);
            else nextParams.delete("status");
            setSearchParams(nextParams);
          }}
          className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All statuses</option>
          <option value="expired">Expired</option>
          <option value="expiring">Expiring soon</option>
          <option value="low-stock">Low stock</option>
          <option value="ok">In stock</option>
        </select>
        {(search || filterCategory || filterSupplier || filterStatus) && (
          <button
            onClick={() => {
              setSearch("");
              setFilterCategory(undefined);
              setFilterSupplier(undefined);
              setSearchParams({});
            }}
            className="text-sm text-ink-muted hover:text-danger transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={25} cols={46} />
        ) : isError ? (
          <div className="p-8 text-center text-red-600 text-sm">
            Failed to load medicines. Please try again.
          </div>
        ) : filteredMedicines.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg text-left">
                  <th className="px-6 py-3 font-medium text-ink-muted">Name</th>
                  <th className="px-6 py-3 font-medium text-ink-muted">Category</th>
                  <th className="px-6 py-3 font-medium text-ink-muted">Supplier</th>
                  <th className="px-6 py-3 font-medium text-ink-muted">Price</th>
                  <th className="px-6 py-3 font-medium text-ink-muted">Stock</th>
                  <th className="px-6 py-3 font-medium text-ink-muted">Expiry</th>
                  <th className="px-6 py-3 font-medium text-ink-muted">Status</th>
                  <th className="px-6 py-3 font-medium text-ink-muted w-40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map((med) => {
                  const status = getStockStatus(med);
                  const expiryWarning = getExpiryWarning(med.expiry_date);
                  const medId = med.medicine_id;
                  return (
                    <tr
                      key={medId}
                      className={`border-b border-border last:border-0 transition-colors ${
                        expiryWarning === "Expired"
                          ? "bg-red-50/70 hover:bg-red-100/70"
                          : expiryWarning
                            ? "bg-yellow-50/70 hover:bg-yellow-100/70"
                            : "hover:bg-bg"
                      }`}
                    >
                      <td className="px-6 py-3 font-medium text-ink">
                        {med.medicine_name}
                      </td>
                      <td className="px-6 py-3 text-ink-muted">
                        {categoryMap[med.category_id] ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-ink-muted">
                        {supplierMap[med.supplier_id] ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-ink-muted">
                        GH₵{med.unit_price.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-ink-muted">
                        {med.inventory?.quantity_available ?? 0}
                        <span className="text-ink-muted/50 text-xs ml-1">
                          / min {med.inventory?.minimum_stock_level ?? 10}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-ink-muted">
                        <div>{med.expiry_date}</div>
                        {expiryWarning && (
                          <span
                            className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                              expiryWarning === "Expired"
                                ? "border-red-200 bg-red-100 text-red-700"
                                : "border-yellow-200 bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {expiryWarning}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setStockTarget(med)}
                            className="text-primary hover:underline text-xs"
                          >
                            Stock
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => openEditForm(med)}
                                className="text-primary hover:underline text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteTarget(med)}
                                className="text-red-600 hover:underline text-xs"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-ink-muted text-sm">
            No medicines found.
            {isAdmin && !search && !filterCategory && !filterSupplier
              ? ' Click "Add medicine" to get started.'
              : " Try adjusting your search or filters."}
          </div>
        )}
      </div>

      {/* Modals */}
      {isFormOpen && (
        <MedicineFormModal
          initialData={editingMedicine}
          categories={categories}
          suppliers={suppliers}
          onSubmit={handleFormSubmit}
          onClose={closeForm}
          isSaving={isSaving}
          error={formError}
        />
      )}

      {deleteTarget !== null && (
        <ConfirmDialog
          title="Delete this medicine?"
          message={`${deleteTarget.medicine_name} will be permanently removed from the inventory.`}
          confirmLabel="Delete medicine"
          onConfirm={() => handleDelete(deleteTarget.medicine_id)}
          onCancel={() => setDeleteTarget(null)}
          isPending={deleteMutation.isPending}
        />
      )}

      {stockTarget !== null && (
        <AdjustStockModal
          medicine={stockTarget}
          onConfirm={(change) => handleStockAdjust(stockTarget.medicine_id, change)}
          onCancel={() => setStockTarget(null)}
          isSubmitting={stockMutation.isPending}
        />
      )}
    </div>
  );
}

// -----------------------------
// Add / Edit form modal
// -----------------------------
function MedicineFormModal({
  initialData,
  categories,
  suppliers,
  onSubmit,
  onClose,
  isSaving,
  error,
}: {
  initialData: MedicineWithStockResponse | null;
  categories: CategoryResponse[];
  suppliers: SupplierResponse[];
  onSubmit: (data: MedicineCreate) => void;
  onClose: () => void;
  isSaving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<MedicineCreate>({
    medicine_name: initialData?.medicine_name ?? "",
    category_id: initialData?.category_id ?? (categories[0]?.category_id ?? 0),
    supplier_id: initialData?.supplier_id ?? (suppliers[0]?.supplier_id ?? 0),
    description: initialData?.description ?? "",
    unit_price: initialData?.unit_price ?? 0,
    expiry_date: initialData?.expiry_date ?? "",
    initial_quantity: initialData?.inventory?.quantity_available ?? 0,
    minimum_stock_level: initialData?.inventory?.minimum_stock_level ?? 10,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    const numericFields = [
      "category_id",
      "supplier_id",
      "unit_price",
      "initial_quantity",
      "minimum_stock_level",
    ];
    setForm((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="font-display font-bold text-lg text-ink mb-4">
          {initialData ? "Edit medicine" : "Add medicine"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-ink mb-1">
                Medicine name
              </label>
              <input
                name="medicine_name"
                type="text"
                required
                value={form.medicine_name}
                onChange={handleChange}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Category
              </label>
              <select
                name="category_id"
                required
                value={form.category_id}
                onChange={handleChange}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Supplier
              </label>
              <select
                name="supplier_id"
                required
                value={form.supplier_id}
                onChange={handleChange}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.supplier_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Unit price (GH₵)
              </label>
              <input
                name="unit_price"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.unit_price}
                onChange={handleChange}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Expiry date
              </label>
              <input
                name="expiry_date"
                type="date"
                required
                value={form.expiry_date}
                onChange={handleChange}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {!initialData && (
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Initial quantity
                </label>
                <input
                  name="initial_quantity"
                  type="number"
                  min="0"
                  value={form.initial_quantity}
                  onChange={handleChange}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Minimum stock level
              </label>
              <input
                name="minimum_stock_level"
                type="number"
                min="0"
                value={form.minimum_stock_level}
                onChange={handleChange}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-ink mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                required
                value={form.description}
                onChange={handleChange}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -----------------------------
// Adjust stock modal
// -----------------------------
function AdjustStockModal({
  medicine,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  medicine: MedicineWithStockResponse;
  onConfirm: (change: number) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [change, setChange] = useState(0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-lg w-full max-w-sm p-6">
        <h2 className="font-display font-bold text-lg text-ink mb-1">
          Adjust stock
        </h2>
        <p className="text-sm text-ink-muted mb-4">
          {medicine.medicine_name} — current stock:{" "}
          <span className="font-medium text-ink">
            {medicine.inventory?.quantity_available ?? 0}
          </span>
        </p>
        <div className="mb-2">
          <label className="block text-sm font-medium text-ink mb-1">
            Quantity change
          </label>
          <input
            type="number"
            value={change}
            onChange={(e) => setChange(Number(e.target.value))}
            className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p className="text-xs text-ink-muted mt-1">
            Positive to restock, negative to reduce.
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(change)}
            disabled={isSubmitting || change === 0}
            className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Saving..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Medicines;