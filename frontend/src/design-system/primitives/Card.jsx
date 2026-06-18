import { cn } from '../../lib/utils.js';

/**
 * Card — simple surface container for content.
 * Generic and styling-light; supports `className` and `children`.
 */
export function Card({ className, children, ...rest }) {
  return (
    <div
      className={cn(
        'rounded-md border border-rule bg-paper shadow-sm',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
