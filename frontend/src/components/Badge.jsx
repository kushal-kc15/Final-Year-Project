import { cn } from '../lib/utils.js';

export function Badge({ tone = 'ink', children, className, dot = false }) {
  return <Ribbon tone={tone} className={className} dot={dot}>{children}</Ribbon>;
}

export function Ribbon({ tone = 'ink', children, className, dot = false }) {
  const tones = {
    ink: 'bg-inkwell-50 text-inkwell-700 border-inkwell-200/30',
    cinnabar: 'bg-cinnabar-50 text-cinnabar-700 border-cinnabar-200/30',
    moss: 'bg-moss-50 text-moss-700 border-moss-200/30',
    saffron: 'bg-saffron-50 text-saffron-700 border-saffron-200/30',
    paper: 'bg-paper-deep text-ink-muted border-rule/30',
  };
  const dots = {
    ink: 'bg-inkwell-500',
    cinnabar: 'bg-cinnabar-500',
    moss: 'bg-moss-500',
    saffron: 'bg-saffron-500',
    paper: 'bg-ink-muted',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium tracking-wide rounded-full border',
        tones[tone],
        className
      )}
    >
      {dot && <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', dots[tone])} />}
      {children}
    </span>
  );
}

export function Tag({ children, className, color = null }) {
  const hue = color ?? (() => {
    let hash = 0;
    for (let i = 0; i < children.length; i++) {
      hash = children.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
  })();
  const bg = `oklch(0.94 0.04 ${hue})`;
  const ink = `oklch(0.32 0.10 ${hue})`;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-sm',
        className
      )}
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
        'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border transition-all duration-150',
        'hover:scale-[1.02] active:scale-[0.98]',
        selected
          ? 'bg-ink text-paper border-ink shadow-sm'
          : 'bg-paper text-ink-soft border-rule-strong hover:border-ink-muted',
        className
      )}
    >
      {children}
    </button>
  );
}

// Add default export for backward compatibility
export default Badge;