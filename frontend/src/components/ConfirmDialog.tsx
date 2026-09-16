import { useEffect, useRef } from "react";
import { X } from "lucide-react";

function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  isPending = false,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPending, onCancel]);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4" role="presentation">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="confirm-dialog-title" className="font-display text-lg font-bold text-ink">{title}</h2>
            <p className="mt-2 text-sm text-ink-muted">{message}</p>
          </div>
          <button type="button" aria-label="Close dialog" onClick={onCancel} disabled={isPending} className="text-ink-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={isPending} className="rounded-md border border-border px-4 py-2 text-sm text-ink-muted hover:text-ink disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={isPending} className="rounded-md bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {isPending ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;