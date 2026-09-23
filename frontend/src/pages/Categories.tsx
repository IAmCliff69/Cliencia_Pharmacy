import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/categories";
import type { CategoryResponse, CategoryCreate } from "../types/category";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { SkeletonTable } from "../components/Skeleton";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 20;

function Categories() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ["categories", page],
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    queryFn: () => getCategories({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }),
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeModal();
      showToast("Category created.", "success");
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail ?? "Failed to create category.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryCreate }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeModal();
      showToast("Category updated.", "success");
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail ?? "Failed to update category.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteTarget(null);
      showToast("Category deleted.", "success");
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.detail ?? "Failed to delete category.", "error");
    },
  });

  const openAddModal = () => {
    setEditingCategory(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: CategoryResponse) => {
    setEditingCategory(category);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormError(null);
  };

  const handleSubmit = (data: CategoryCreate) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.category_id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Categories</h1>
          <p className="text-ink-muted text-sm mt-1">
            Medicine categories used across inventory.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
          >
            Add category
          </button>
        )}
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={6} cols={3} />
        ) : isError ? (
          <div className="p-8 text-center text-danger text-sm">
            Failed to load categories. Please try again.
          </div>
        ) : categories && categories.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left">
                <th className="px-6 py-3 font-medium text-ink-muted">Name</th>
                <th className="px-6 py-3 font-medium text-ink-muted">Description</th>
                {isAdmin && <th className="px-6 py-3 font-medium text-ink-muted w-32">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.category_id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3 text-ink font-medium">{category.category_name}</td>
                  <td className="px-6 py-3 text-ink-muted">
                    {category.description || <span className="text-ink-muted/50">—</span>}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEditModal(category)}
                          className="text-primary hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(category)}
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
            No categories yet.
            {isAdmin && " Click \"Add category\" to create your first one."}
          </div>
        )}
      </div>

      <Pagination
        page={page}
        hasNextPage={(categories?.length ?? 0) === PAGE_SIZE}
        onPageChange={setPage}
      />

      {isModalOpen && (
        <CategoryModal
          initialData={editingCategory}
          onSubmit={handleSubmit}
          onClose={closeModal}
          isSaving={isSaving}
          error={formError}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          categoryName={deleteTarget.category_name}
          onConfirm={() => deleteMutation.mutate(deleteTarget.category_id)}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

// -----------------------------
// Add/Edit modal
// -----------------------------
function CategoryModal({
  initialData,
  onSubmit,
  onClose,
  isSaving,
  error,
}: {
  initialData: CategoryResponse | null;
  onSubmit: (data: CategoryCreate) => void;
  onClose: () => void;
  isSaving: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(initialData?.category_name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ category_name: name, description: description || undefined });
  };

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="font-display font-bold text-lg text-ink mb-4">
          {initialData ? "Edit category" : "Add category"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category_name" className="block text-sm font-medium text-ink mb-1">
              Name
            </label>
            <input
              id="category_name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-ink mb-1">
              Description <span className="text-ink-muted font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
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
  categoryName,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  categoryName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-lg w-full max-w-sm p-6">
        <h2 className="font-display font-bold text-lg text-ink mb-2">Delete category?</h2>
        <p className="text-sm text-ink-muted mb-6">
          Are you sure you want to delete <span className="font-medium text-ink">{categoryName}</span>?
          This can't be undone.
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

export default Categories;