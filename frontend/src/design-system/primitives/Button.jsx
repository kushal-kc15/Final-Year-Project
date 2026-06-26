import { forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

const variants = {
  primary:
    'bg-forest-600 text-paper border border-forest-600 hover:bg-forest-700 hover:border-forest-700 active:bg-forest-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  secondary:
    'bg-paper text-ink border border-rule-strong hover:bg-paper-deep hover:border-ink-muted active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  ghost:
    'bg-transparent text-ink-soft border border-transparent hover:bg-paper-deep hover:text-ink active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  danger:
    'bg-paper text-cinnabar-700 border border-cinnabar-200 hover:bg-cinnabar-50 hover:border-cinnabar-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  link:
    'bg-transparent text-ink border-0 border-b border-ink/30 px-0 py-0.5 rounded-none hover:text-cinnabar-600 hover:border-cinnabar-600 disabled:opacity-40 disabled:pointer-events-none',
};

const sizes = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
};

const Button = forwardRef(function Button(
  {
    as: Tag = 'button',
    variant = 'secondary',
    size = 'md',
    iconLeft,
    iconRight,
    iconOnly,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  const sizeClass = iconOnly
    ? `${sizes[size]} w-${size === 'lg' ? '12' : size === 'md' ? '10' : size === 'sm' ? '8' : '7'} px-0 justify-center`
    : sizes[size];

  return (
    <Tag
      ref={ref}
      type={Tag === 'button' ? type : undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium select-none whitespace-nowrap',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
        variant === 'link' ? 'rounded-none' : 'rounded-sm',
        variants[variant],
        sizeClass,
        className
      )}
      {...rest}
    >
      {iconLeft && <span className="inline-flex shrink-0">{iconLeft}</span>}
      {children}
      {iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
    </Tag>
  );
});

export default Button;