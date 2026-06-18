import { forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

/**
 * Vyapar Margadarshan button vocabulary.
 *
 * - `primary`:  solid cinnabar ink, used sparingly for the single most important action per surface.
 * - `secondary`: paper with hairline rule. The default for the rest of the actions.
 * - `ghost`:    no chrome, used for tertiary/inline actions.
 * - `danger`:   cinnabar outline; for destructive intent where the button shouldn't shout.
 * - `link`:     underlined inline action, used in copy.
 *
 * Buttons never carry a drop shadow. They are flat typographic instruments.
 */
const variants = {
  primary:
    'bg-cinnabar-500 text-paper border border-cinnabar-500 hover:bg-cinnabar-600 hover:border-cinnabar-600 active:bg-cinnabar-700 disabled:bg-cinnabar-300 disabled:border-cinnabar-300',
  secondary:
    'bg-paper text-ink border border-rule-strong hover:bg-paper-deep hover:border-ink-muted disabled:text-ink-faint disabled:bg-paper',
  ghost:
    'bg-transparent text-ink-soft border border-transparent hover:bg-paper-deep hover:text-ink disabled:text-ink-faint',
  danger:
    'bg-paper text-cinnabar-700 border border-cinnabar-200 hover:bg-cinnabar-50 hover:border-cinnabar-500',
  link:
    'bg-transparent text-ink border-0 border-b border-ink px-0 py-0.5 rounded-none hover:text-cinnabar-600 hover:border-cinnabar-600',
};

const sizes = {
  xs: 'h-7  px-2.5 text-xs  gap-1.5',
  sm: 'h-8  px-3   text-sm  gap-1.5',
  md: 'h-10 px-4   text-sm  gap-2',
  lg: 'h-12 px-5   text-base gap-2',
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
    ? `${sizes[size]} w-${size === 'lg' ? '12' : size === 'md' ? '10' : size === 'sm' ? '8' : '7'} px-0`
    : sizes[size];

  return (
    <Tag
      ref={ref}
      type={Tag === 'button' ? type : undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium select-none whitespace-nowrap',
        'transition-colors duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
        'disabled:cursor-not-allowed',
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
