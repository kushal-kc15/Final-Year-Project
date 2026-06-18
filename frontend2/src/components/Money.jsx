import { formatCurrency, formatCompact } from '../lib/currency.js';
import { cn } from '../lib/utils.js';

/**
 * <Money /> — the only place we render money in this app.
 * Forces a monospaced tabular figure so columns of amounts line up.
 * The accent: a tiny cinnabar underline beneath the integer part is reserved
 * for the current/recent column in the ledger, not the default treatment.
 */
export function Money({
  amount,
  value,
  currency = 'NPR',
  size = 'md',
  align = 'right',
  muted = false,
  negative = false,
  compact = false,
  className,
  prefix,
}) {
  const sizeMap = {
    sm:  'text-sm',
    md:  'text-base',
    lg:  'text-xl',
    xl:  'text-2xl',
    '2xl': 'text-3xl',
    display: 'text-4xl',
  };
  const raw = amount ?? value ?? 0;
  const display = compact ? formatCompact(raw, currency) : formatCurrency(raw, currency);
  return (
    <span
      className={cn(
        'num inline-block tabular-nums',
        sizeMap[size],
        muted ? 'text-ink-muted' : 'text-ink',
        negative && 'text-cinnabar-700',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
    >
      {prefix && <span className="mr-1 text-ink-muted font-sans">{prefix}</span>}
      {display}
    </span>
  );
}

export default Money;
