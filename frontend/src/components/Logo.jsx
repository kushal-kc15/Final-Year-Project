/**
 * Vyapar Margadarshan logo.
 *
 * Flat SVG app mark: warm terracotta square with a bold white receipt roll.
 * Supports an optional compact wordmark for the app shell and wider nav space.
 */
export default function Logo({
  size = 32,
  className = '',
  showText,
  withWordmark = false,
  wordmarkSize = 'md',
}) {
  const shouldShowText = showText ?? withWordmark;
  const wordmarkSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        aria-label="Vyapar Margadarshan"
        role="img"
        className="shrink-0"
      >
        <rect width="64" height="64" rx="14" fill="#C95F43" />

        <g
          stroke="#FFF8EF"
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Main receipt sheet with jagged bottom. */}
          <path d="M40.5 14H22.2c-4.1 0-6.1 3.5-8.4 9.1-3.9 9.6-3.8 21.4 1 31.3 1 2 2.3 4.3 3.9 4.3 1.5 0 3.6-3.7 5.4-3.7 1.7 0 3.9 3.7 5.6 3.7 1.8 0 3.9-3.7 5.7-3.7 2.4 0 6.2 4.1 13.2 3.6" />

          {/* Rolled top-right receipt curl. */}
          <path d="M40.5 14c-4.9 5.9-7.7 18.9-5.2 31.2 1.4 6.9 4.5 11.7 9.4 13.1" />
          <path d="M40.5 14h4.7c4.6 0 7.7 7.1 9 13.2l1.1 5.3c.5 2.4-1.2 4.5-3.6 4.5H35.2" />

          {/* Ledger marks. */}
          <path d="M22.1 25.4h10" />
          <path d="M20.8 32.1h10.7" />
          <path d="M21.8 38.8h5.9" />
        </g>
      </svg>

      {shouldShowText && (
        <span className="min-w-0 leading-none">
          <span className={`block truncate font-display font-medium text-ink ${wordmarkSizes[wordmarkSize] || wordmarkSizes.md}`}>
            Vyapar Margadarshan
          </span>
          <span className="mt-0.5 block truncate text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-ink-muted">
            Expense Management
          </span>
        </span>
      )}
    </span>
  );
}
