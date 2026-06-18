import { cn, initials, hueFromString } from '../lib/utils.js';

/**
 * Avatar — a 32x32 paper-deep square with the user's initials.
 * No rounded-full smiley. No stock photos. The hue comes from the username
 * (a deterministic hash), so a person always looks the same color.
 */
export function Avatar({ name = '', size = 32, className, status }) {
  const h = hueFromString(name);
  const bg = `oklch(0.94 0.025 ${h})`;
  const ink = `oklch(0.32 0.10 ${h})`;
  return (
    <span
      className={cn('inline-flex items-center justify-center rounded-sm font-medium select-none relative', className)}
      style={{ width: size, height: size, background: bg, color: ink, fontSize: Math.max(10, size * 0.4) }}
      aria-label={name}
    >
      {initials(name)}
      {status && (
        <span
          aria-hidden
          className={cn(
            'absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-pill border-2 border-paper',
            status === 'online' && 'bg-moss-500',
            status === 'offline' && 'bg-ink-faint',
          )}
        />
      )}
    </span>
  );
}
