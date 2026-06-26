import { cn } from '../../lib/utils.js';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/Button.jsx'; // fixed import

/**
 * PageHeader — the masthead of a working page.
 * - Title is the primary element.
 * - Optional byline above the title.
 * - Optional lede (description) below.
 * - Actions on the right (e.g., Add button).
 * - Optional `back` button for detail pages.
 */
export function PageHeader({
  title,
  byline,
  lede,
  actions,
  className,
  children,
  back,
  onBack,
  compact = false,
}) {
  return (
    <header
      className={cn(
        'border-b border-rule bg-paper',
        compact ? 'px-3 py-2 sm:px-4 sm:py-2' : 'px-4 py-3 sm:px-5 sm:py-3',
        className
      )}
    >
      <div className={cn(
        'flex flex-col items-stretch sm:flex-row sm:items-center sm:justify-between',
        compact ? 'gap-2' : 'gap-3'
      )}>
        <div className={cn('min-w-0 flex items-center', compact ? 'gap-2' : 'gap-3')}>
          {back && (
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<ArrowLeft size={16} />}
              onClick={onBack}
              className="shrink-0 -ml-1"
            >
              Back
            </Button>
          )}
          <div>
            {byline && <p className={cn('text-micro uppercase tracking-eyebrow text-ink-muted', compact ? 'mb-0' : 'mb-0.5')}>{byline}</p>}
            <h1 className={cn(
              'font-display font-medium text-ink leading-[1.12] tracking-tight',
              compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-[1.875rem]'
            )}>
              {title}
            </h1>
            {lede && <p className={cn(
              'text-ink-muted max-w-2xl leading-snug',
              compact ? 'mt-0.5 text-xs sm:text-sm' : 'mt-1 text-sm'
            )}>{lede}</p>}
          </div>
        </div>
        {actions && (
          <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:shrink-0 sm:justify-end">
            {actions}
          </div>
        )}
      </div>
      {children}
    </header>
  );
}
