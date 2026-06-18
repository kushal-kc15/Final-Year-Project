/**
 * Vyapar Margadarshan logomark.
 *
 * A ledger page (ruled lines) and a cinnabar underline that runs off the page
 * — suggesting a real accountant's ledger with a red-ink pen at work. No
 * gradient, no glow, no rounded-2xl frame.
 */
export default function Logo({ size = 32, className, withWordmark = false, wordmarkSize = 'md' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-label="Vyapar Margadarshan"
        role="img"
      >
        {/* Page */}
        <rect x="4" y="4" width="18" height="24" rx="1" fill="oklch(0.985 0.003 85)" stroke="oklch(0.20 0.012 260)" strokeWidth="1.4" />
        {/* Ruled lines */}
        <line x1="8" y1="10" x2="18" y2="10" stroke="oklch(0.20 0.012 260)" strokeWidth="1" />
        <line x1="8" y1="14" x2="18" y2="14" stroke="oklch(0.20 0.012 260)" strokeWidth="1" />
        <line x1="8" y1="18" x2="16" y2="18" stroke="oklch(0.20 0.012 260)" strokeWidth="1" />
        {/* Red-ink total line — runs off the page */}
        <line x1="8" y1="24" x2="30" y2="24" stroke="oklch(0.56 0.17 25)" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="22" y1="6" x2="30" y2="6" stroke="oklch(0.56 0.17 25)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      {withWordmark && (
        <span className="leading-none">
          <span className={`block font-display font-semibold text-ink ${wordmarkSize === 'lg' ? 'text-lg' : 'text-sm'}`}>
            Vyapar Margadarshan
          </span>
          {wordmarkSize === 'lg' && (
            <span className="block text-micro uppercase tracking-eyebrow text-ink-muted mt-0.5">
              Expense management
            </span>
          )}
        </span>
      )}
    </span>
  );
}
