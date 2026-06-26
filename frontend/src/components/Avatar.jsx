import { cn, initials, hueFromString } from '../lib/utils.js';

export function Avatar({
  name = '',
  size = 32,
  className,
  status,
  interactive = false,
}) {
  const h = hueFromString(name);
  const bg = `oklch(0.94 0.025 ${h})`;
  const ink = `oklch(0.32 0.10 ${h})`;

  // Size mapping for named sizes
  const sizeMap = {
    sm: 24,
    md: 32,
    lg: 40,
  };
  const px = typeof size === 'string' ? sizeMap[size] || 32 : size;
  const fontSize = Math.max(10, px * 0.4);

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-sm font-medium select-none relative',
        interactive && 'hover:scale-105 transition-transform duration-200',
        className
      )}
      style={{ width: px, height: px, background: bg, color: ink, fontSize }}
      aria-label={name}
      title={name}
    >
      {initials(name)}
      {status && (
        <span
          aria-hidden
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-paper',
            status === 'online' && 'bg-moss-500 animate-pulse',
            status === 'offline' && 'bg-ink-faint',
            status === 'away' && 'bg-saffron-500'
          )}
        />
      )}
    </span>
  );
}