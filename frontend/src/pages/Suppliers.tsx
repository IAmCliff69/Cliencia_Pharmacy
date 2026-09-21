import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../api/suppliers";
import type { SupplierResponse, SupplierCreate } from "../types/supplier";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { SkeletonTable } from "../components/Skeleton"

function Suppliers() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  const { data: suppliers, isLoading, isError } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      closeModal();
      showToast("Supplier created successfully.", "success");
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail ?? "Failed to create supplier.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SupplierCreate }) =>
      updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      closeModal();
      showToast("Supplier updated successfully.", "success");
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail ?? "Failed to update supplier.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setDeleteTarget(null);
      showToast("Supplier deleted successfully.", "success");
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.detail ?? "Failed to delete supplier.", "error");
    },
  });

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: SupplierResponse) => {
    setEditingSupplier(supplier);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    setFormError(null);
  };

  const handleSubmit = (data: SupplierCreate) => {
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.supplier_id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const filteredSuppliers = (suppliers ?? []).filter((supplier) => {
    const value = search.trim().toLowerCase();
    return !value || [supplier.supplier_name, supplier.contact_person, supplier.phone, supplier.email]
      .join(" ")
      .toLowerCase()
      .includes(value);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Suppliers</h1>
          <p className="text-ink-muted text-sm mt-1">
            Manage medicine suppliers and their contact details.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
          >
            Add supplier
          </button>
        )}
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search suppliers, contacts, phone, or email..."
          className="w-full max-w-xl rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={10} cols={5} />
        ) : isError ? (
          <div className="p-8 text-center text-danger text-sm">
            Failed to load suppliers. Please try again.
          </div>
        ) : filteredSuppliers.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left">
                <th className="px-6 py-3 font-medium text-ink-muted">Supplier</th>
                <th className="px-6 py-3 font-medium text-ink-muted">Contact Person</th>
                <th className="px-6 py-3 font-medium text-ink-muted">Phone</th>
                <th className="px-6 py-3 font-medium text-ink-muted">Email</th>
                <th className="px-6 py-3 font-medium text-ink-muted">Address</th>
                {isAdmin && (
                  <th className="px-6 py-3 font-medium text-ink-muted w-32">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => (
                <tr
                  key={supplier.supplier_id}
                  className="border-b border-border last:border-0 hover:bg-bg transition-colors"
                >
                  <td className="px-6 py-3 font-medium text-ink">
                    {supplier.supplier_name}
                  </td>
                  <td className="px-6 py-3 text-ink-muted">
                    {supplier.contact_person}
                  </td>
                  <td className="px-6 py-3 text-ink-muted">{supplier.phone}</td>
                  <td className="px-6 py-3 text-ink-muted">{supplier.email}</td>
                  <td className="px-6 py-3 text-ink-muted">{supplier.address}</td>
                  {isAdmin && (
                    <td className="px-6 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="text-primary hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(supplier)}
                          className="text-danger hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-ink-muted text-sm">
            {search ? "No suppliers match your search." : "No suppliers yet."}
            {isAdmin && " Click \"Add supplier\" to create your first one."}
          </div>
        )}
      </div>

      {isModalOpen && (
        <SupplierModal
          initialData={editingSupplier}
          onSubmit={handleSubmit}
          onClose={closeModal}
          isSaving={isSaving}
          error={formError}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          supplierName={deleteTarget.supplier_name}
          onConfirm={() => deleteMutation.mutate(deleteTarget.supplier_id)}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

// -----------------------------
// Add / Edit modal
// -----------------------------
function SupplierModal({
  initialData,
  onSubmit,
  onClose,
  isSaving,
  error,
}: {
  initialData: SupplierResponse | null;
  onSubmit: (data: SupplierCreate) => void;
  onClose: () => void;
  isSaving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<SupplierCreate>({
    supplier_name: initialData?.supplier_name ?? "",
    contact_person: initialData?.contact_person ?? "",
    phone: initialData?.phone ?? "",
    email: initialData?.email ?? "",
    address: initialData?.address ?? "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-lg w-full max-w-lg p-6">
        <h2 className="font-display font-bold text-lg text-ink mb-4">
          {initialData ? "Edit supplier" : "Add supplier"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-ink mb-1">
                Supplier name
              </label>
              <input
                name="supplier_name"
                type="text"
                required
                value={form.supplier_name}
                onChange={handleChange}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Contact person
              </label>
              <input
                name="contact_person"
                type="text"
                required
                value={form.contact_person}
                onChange={handleChange}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Phone
              </label>
              <input
                name="phone"
                type="text"
                required
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Address
              </label>
              <input
                name="address"
                type="text"
                required
                value={form.address}
                onChange={handleChange}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded px-3 py-2">
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
// Delete confirmation
// -----------------------------
function ConfirmDeleteModal({
  supplierName,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  supplierName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-lg w-full max-w-sm p-6">
        <h2 className="font-display font-bold text-lg text-ink mb-2">
          Delete supplier?
        </h2>
        <p className="text-sm text-ink-muted mb-6">
          Are you sure you want to delete{" "}
          <span className="font-medium text-ink">{supplierName}</span>? This
          can't be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-danger text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Suppliers;