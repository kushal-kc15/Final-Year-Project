import { cn } from '../../lib/utils.js';
import { Inbox } from 'lucide-react';

/** Spinner — used inside buttons or as a loading indicator. */
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

/** Skeleton block – shimmer animation. */
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

/** Empty state – teach the interface, not "nothing here." */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-6 py-10', className)}>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-rule bg-paper-deep text-ink-muted">
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <h4 className="font-display text-lg font-medium text-ink">{title}</h4>
      {description && <p className="mt-1.5 max-w-md text-sm text-ink-muted leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** LoadingState – lightweight wrapper. */
export function LoadingState({ className, message = 'Loading…', showSpinner = true }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-6 py-10', className)}>
      {showSpinner && <Spinner className="text-ink-muted mb-3" />}
      <p className="text-sm text-ink-muted leading-relaxed">{message}</p>
    </div>
  );
}

/** ErrorState – uses EmptyState with a danger icon. */
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
      icon={({ size, ...props }) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={size} height={size} {...props}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" />
          <path d="M12 8v5" stroke="currentColor" strokeLinecap="round" />
          <circle cx="12" cy="16" r="0.5" fill="currentColor" />
        </svg>
      )}
    />
  );
}