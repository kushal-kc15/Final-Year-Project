import { Ribbon } from './Badge.jsx';
import { STATUS } from '../lib/date.js';
import { cn } from '../lib/utils.js'; // <-- add this import

export function StatusPill({ status, className }) {
  const meta = STATUS[status] ?? { label: status ?? '—', tone: 'ink' };
  return (
    <Ribbon tone={meta.tone} dot className={cn('border border-rule/20', className)}>
      {meta.label}
    </Ribbon>
  );
}

export default StatusPill;