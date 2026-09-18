"use client";

// Shared numbered-pagination control used across the admin list pages
// (Products & Batches, Scan Log, Blocked QR Codes). Keeps the "Page X of Y"
// logic and button states in one place instead of repeating it per page.

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Show at most 5 page numbers at a time, centered on the current page.
  const pageNumbers: number[] = [];
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + 4);
  start = Math.max(1, end - 4);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
      <p className="text-xs text-neutral-500">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-white"
        >
          Prev
        </button>
        {start > 1 && (
          <>
            <PageButton n={1} active={page === 1} onClick={onPageChange} />
            {start > 2 && <span className="text-neutral-400 text-xs px-1">…</span>}
          </>
        )}
        {pageNumbers.map((n) => (
          <PageButton key={n} n={n} active={n === page} onClick={onPageChange} />
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="text-neutral-400 text-xs px-1">…</span>}
            <PageButton n={totalPages} active={page === totalPages} onClick={onPageChange} />
          </>
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-white"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function PageButton({
  n,
  active,
  onClick,
}: {
  n: number;
  active: boolean;
  onClick: (page: number) => void;
}) {
  return (
    <button
      onClick={() => onClick(n)}
      className={
        "text-xs w-7 h-7 rounded-lg border " +
        (active
          ? "bg-emerald-700 border-emerald-700 text-white"
          : "bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-700")
      }
    >
      {n}
    </button>
  );
}
