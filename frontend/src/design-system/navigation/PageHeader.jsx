import { cn } from '../../lib/utils.js';

/**
 * PageHeader — the masthead of a working page.
 *
 * No eyebrow above the title. The title is the title. The only supporting
 * element is an optional byline (a single line of muted text below) and
 * a row of actions on the right.
 *
 * On the Dashboard this is replaced with a custom editorial header, but the
 * pattern stays the same.
 */
export function PageHeader({ title, byline, actions, className, lede, children }) {
  return (
    <header className={cn('px-4 py-3 sm:px-5 sm:py-3 border-b border-rule bg-paper', className)}>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {byline && <p className="text-micro uppercase tracking-eyebrow text-ink-muted mb-0.5">{byline}</p>}
          <h1 className="font-display text-2xl sm:text-[1.875rem] font-medium text-ink leading-[1.12] tracking-tight">
            {title}
          </h1>
          {lede && <p className="mt-1 text-sm text-ink-muted max-w-2xl leading-snug">{lede}</p>}
        </div>
        {actions && <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:shrink-0 sm:justify-end">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
