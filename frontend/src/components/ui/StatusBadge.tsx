import type { ShowStatus } from '../../types';
import { STATUS_LABELS, STATUS_COLORS } from '../../types';

interface StatusBadgeProps {
  status: ShowStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${STATUS_COLORS[status]} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
