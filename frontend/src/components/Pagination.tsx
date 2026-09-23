interface PaginationProps {
  page: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}

function Pagination({ page, hasNextPage, onPageChange }: PaginationProps) {
  if (page === 1 && !hasNextPage) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="rounded-md border border-border px-3 py-1.5 text-ink-muted transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-ink-muted">Page {page}</span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage}
        className="rounded-md border border-border px-3 py-1.5 text-ink-muted transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;
