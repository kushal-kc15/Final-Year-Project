import { cn } from '../../lib/utils.js';

/** Spinner — used inside buttons during async work. */
export function Spinner({ className, size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn('animate-spin', className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" fill="none" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Skeleton block. The hairline-ruled background makes them blend in. */
export function Skeleton({ className, ...rest }) {
  return (
    <div
      className={cn(
        'bg-paper-deep rounded-xs relative overflow-hidden',
        'after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-paper/60 after:to-transparent',
        'after:translate-x-[-100%] after:animate-[shimmer_1.6s_infinite]',
        className
      )}
      {...rest}
    />
  );
}

/** Empty state — teach the interface, not "nothing here." */
export function EmptyState({ title, description, icon: Icon, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-6 py-10', className)}>
      {Icon && (
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-pill border border-rule bg-paper-deep text-ink-muted">
          <Icon size={18} strokeWidth={1.5} />
        </div>
      )}
      <h4 className="font-display text-lg font-medium text-ink">{title}</h4>
      {description && <p className="mt-1.5 max-w-md text-sm text-ink-muted leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * LoadingState — lightweight, no API coupling.
 * Prefer Skeleton for content regions; keep simple spinner fallback.
 */
export function LoadingState({ className, message = 'Loading…', showSpinner = true }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-6 py-10', className)}>
      {showSpinner && <Spinner className="text-ink-muted mb-3" />}
      <p className="text-sm text-ink-muted leading-relaxed">{message}</p>
    </div>
  );
}

/**
 * ErrorState — show an interface-safe error with optional retry action.
 */
export function ErrorState({
  className,
  title = 'Something went wrong',
  description = 'Please try again.',
  action,
}) {
  return (
    <EmptyState
      className={className}
      title={title}
      description={description}
      action={action}
    />
  );
}
