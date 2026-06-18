import { cn } from '../lib/utils.js';

/**
 * Ribbon / Pill vocabulary.
 *
 *   Ribbon  — for status. Tracked micro caps, soft tone background.
 *   Tag     — for categorical labels (a category on a receipt).
 *   Chip    — removable / selectable token.
 */
/**
 * Badge — public name for the status ribbon used throughout the app.
 * Accepts the same `tone` vocabulary as `Ribbon` (ink, cinnabar, moss, saffron, paper).
 */
export function Badge({ tone = 'ink', children, className, dot = false }) {
  return <Ribbon tone={tone} className={className} dot={dot}>{children}</Ribbon>;
}

export function Ribbon({ tone = 'ink', children, className, dot = false }) {
  const tones = {
    ink:     'bg-inkwell-50 text-inkwell-700',
    cinnabar: 'bg-cinnabar-50 text-cinnabar-700',
    moss:    'bg-moss-50 text-moss-700',
    saffron: 'bg-saffron-50 text-saffron-700',
    paper:   'bg-paper-deep text-ink-muted',
  };
  const dots = {
    ink:      'bg-inkwell-500',
    cinnabar: 'bg-cinnabar-500',
    moss:     'bg-moss-500',
    saffron:  'bg-saffron-500',
    paper:    'bg-ink-muted',
  };
  return (
    <span className={cn('ribbon', tones[tone], className)}>
      {dot && <span aria-hidden className={cn('h-1.5 w-1.5 rounded-pill', dots[tone])} />}
      {children}
    </span>
  );
}

export function Tag({ children, className, hue = 0 }) {
  // Hue is degrees in oklch, used for category swatches.
  const bg = `oklch(0.95 0.04 ${hue})`;
  const ink = `oklch(0.32 0.10 ${hue})`;
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm', className)}
      style={{ background: bg, color: ink }}
    >
      {children}
    </span>
  );
}

export function Chip({ selected, children, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-pill border transition-colors',
        selected
          ? 'bg-ink text-paper border-ink'
          : 'bg-paper text-ink-soft border-rule-strong hover:border-ink-muted',
        className
      )}
    >
      {children}
    </button>
  );
}
