import { cn } from '../lib/utils.js';

/**
 * The single unit of grouping. A panel is a paper surface inside a hairline rule.
 * - default: paper-on-paper with border
 * - deep: slightly darker background (for nested sections)
 * - ledger: a cinnabar top border – for important blocks
 * - elevated: subtle shadow for depth (use sparingly)
 * - inset: no border, sunken (use inside other panels)
 */
export function Panel({
  variant = 'default',
  className,
  children,
  as: Tag = 'section',
  ...rest
}) {
  const styles = {
    default: 'bg-paper border border-rule',
    deep:    'bg-paper-deep border border-rule',
    ledger:  'bg-paper border border-rule border-t-2 border-t-cinnabar-500',
    elevated: 'bg-paper border border-rule shadow-sm hover:shadow-md transition-shadow duration-200',
    inset:   'bg-paper-deep border-0',
  };
  return (
    <Tag className={cn('rounded-md', styles[variant], className)} {...rest}>
      {children}
    </Tag>
  );
}

export function PanelTitle({ children, className }) {
  return (
    <h3 className={cn('font-display text-lg font-medium text-ink leading-tight', className)}>
      {children}
    </h3>
  );
}

export function PanelHeader({
  title,
  subtitle,
  kicker,
  action,
  children,
  className,
}) {
  return (
    <header className={cn(
      'flex flex-col gap-3 border-b border-rule px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:px-5',
      className
    )}>
      <div className="min-w-0">
        {kicker && <p className="text-micro uppercase tracking-eyebrow text-ink-muted mb-1">{kicker}</p>}
        {title && <PanelTitle>{title}</PanelTitle>}
        {subtitle && <p className="mt-1 text-sm text-ink-muted leading-snug">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">{action}</div>}
    </header>
  );
}

export function PanelBody({ className, children, dense = false }) {
  return <div className={cn(dense ? 'p-4' : 'p-5', className)}>{children}</div>;
}

export function PanelFoot({ className, children }) {
  return (
    <footer className={cn('px-5 py-3 border-t border-rule text-xs text-ink-muted', className)}>
      {children}
    </footer>
  );
}