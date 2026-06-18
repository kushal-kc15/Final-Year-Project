import { Ribbon } from './Badge.jsx';
import { STATUS } from '../lib/date.js';

/** Map the API status string to a Ribbon. */
export function StatusPill({ status, className }) {
  const meta = STATUS[status] ?? { label: status ?? '—', tone: 'ink' };
  return (
    <Ribbon tone={meta.tone} dot className={className}>
      {meta.label}
    </Ribbon>
  );
}

export default StatusPill;
