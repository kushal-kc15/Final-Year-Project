import { cn } from '../../lib/utils.js';

export function Card({
  className,
  children,
  variant = 'default',
  ...rest
}) {
  const variants = {
    default: 'border border-rule bg-paper shadow-sm',
    elevated: 'border border-rule/50 bg-paper shadow-md',
    outline: 'border border-rule bg-transparent shadow-none',
  };

  return (
    <div
      className={cn(
        'rounded-md p-4 transition-shadow duration-200',
        variants[variant],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}