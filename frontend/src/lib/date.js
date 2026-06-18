import { format, formatDistanceToNow, parseISO, isToday, isYesterday, differenceInCalendarDays } from 'date-fns';

export function fmtDate(iso, pattern = 'd MMM yyyy') {
  if (!iso) return '—';
  try {
    return format(typeof iso === 'string' ? parseISO(iso) : iso, pattern);
  } catch {
    return '—';
  }
}

export function fmtRelative(iso) {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  if (isToday(d)) return 'today';
  if (isYesterday(d)) return 'yesterday';
  const days = differenceInCalendarDays(new Date(), d);
  if (days >= 0 && days < 7) return `${days}d ago`;
  return format(d, 'd MMM');
}

export function fmtTimestamp(iso) {
  if (!iso) return '—';
  return formatDistanceToNow(typeof iso === 'string' ? parseISO(iso) : iso, { addSuffix: true });
}

/**
 * formatDate(iso, style) — single entry point used by the pages.
 *   style: 'short'   → "13 Jun"
 *   style: 'long'    → "13 Jun 2026"   (default)
 *   style: 'relative'→ "today" / "yesterday" / "3d ago" / "13 Jun"
 */
export function formatDate(iso, style = 'long') {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  if (!d || Number.isNaN(d.getTime())) return '—';
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

export const CATEGORIES = [
  { value: 'FOOD', label: 'Food & Dining' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'OFFICE', label: 'Office supplies' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'SALARY', label: 'Salary' },
  { value: 'RENT', label: 'Rent' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'OTHER', label: 'Other' },
];

export const STATUS = {
  PENDING:  { label: 'Pending',  tone: 'saffron' },
  APPROVED: { label: 'Approved', tone: 'moss' },
  REJECTED: { label: 'Rejected', tone: 'cinnabar' },
  REIMBURSED: { label: 'Reimbursed', tone: 'ink' },
};

export const ROLES = { OWNER: 'Owner', STAFF: 'Staff' };
