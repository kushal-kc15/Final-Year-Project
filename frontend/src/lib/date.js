import { format, differenceInCalendarDays, isToday, isYesterday } from 'date-fns';

// Status mapping for expenses
export const STATUS = {
  PENDING:   { label: 'Pending',  tone: 'saffron' },
  APPROVED:  { label: 'Approved', tone: 'moss' },
  REJECTED:  { label: 'Rejected', tone: 'cinnabar' },
  REIMBURSED: { label: 'Reimbursed', tone: 'ink' },
};

/**
 * formatDate(iso, style) – single entry point used by the pages.
 *   style: 'short'   → "13 Jun"
 *   style: 'long'    → "13 Jun 2026" (default)
 *   style: 'relative'→ "today" / "yesterday" / "3d ago" / "13 Jun"
 */
export function formatDate(iso, style = 'long') {
  if (!iso) return '—';
  let d;
  try {
    d = typeof iso === 'string' ? new Date(iso) : iso;
  } catch {
    return '—';
  }
  if (!d || isNaN(d.getTime())) return '—';

  switch (style) {
    case 'short':
      return format(d, 'd MMM');
    case 'relative':
      if (isToday(d)) return 'today';
      if (isYesterday(d)) return 'yesterday';
      const days = differenceInCalendarDays(new Date(), d);
      if (days >= 0 && days < 7) return `${days}d ago`;
      return format(d, 'd MMM');
    case 'long':
    default:
      return format(d, 'd MMM yyyy');
  }
}

// Re-export useful date-fns functions for convenience.
export { format, differenceInCalendarDays, isToday, isYesterday };