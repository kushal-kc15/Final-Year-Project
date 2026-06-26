import Button from './Button.jsx';

/**
 * PaginationControls
 * - Desktop: "Page X of Y" + Prev/Next
 * - Mobile: "Prev / Page X of Y / Next" (same controls, tighter layout)
 *
 * Client-side pagination helper (works with any in-memory array slice).
 */
export default function PaginationControls({
  page,
  setPage,
  pageSize,
  totalItems,
  hideOnSinglePage = true,
  className = '',
  mobileCompact = true,
}) {
  const safePage = Math.max(1, page);
  const totalPages = Math.max(1, Math.ceil((totalItems ?? 0) / (pageSize ?? 1)));
  const isSinglePage = totalPages <= 1;

  if (hideOnSinglePage && isSinglePage) return null;

  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;

  const onPrev = () => setPage((p) => Math.max(1, p - 1));
  const onNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 px-3 py-3 border-t border-rule text-xs text-ink-muted sm:gap-3 sm:px-5 ${className}`}>
      {mobileCompact ? (
        <>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={!canPrev} onClick={onPrev}>
              Prev
            </Button>
          </div>

          <p className="min-w-0 flex-1 text-center">
            Page <span className="num">{safePage}</span> of <span className="num">{totalPages}</span>
          </p>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={!canNext} onClick={onNext}>
              Next
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="min-w-0">
            Page <span className="num">{safePage}</span> of <span className="num">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={!canPrev} onClick={onPrev}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={!canNext} onClick={onNext}>
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}