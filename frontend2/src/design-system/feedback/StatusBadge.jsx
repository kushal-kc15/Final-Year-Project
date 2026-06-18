import { StatusPill } from '../../components/StatusPill.jsx';

/**
 * StatusBadge — foundation alias compatible with the spec.
 * Reuses the existing StatusPill behavior to avoid breaking legacy imports.
 */
export { StatusPill as StatusBadge };
export default StatusBadge;

/**
 * Named export preserved for consumers expecting `StatusBadge`.
 */
const StatusBadge = StatusPill;
