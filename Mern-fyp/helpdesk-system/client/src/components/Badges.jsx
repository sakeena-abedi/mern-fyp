import { StatusIcon, PriorityIcon } from './StatusIcon';

export const StatusBadge = ({ status }) => {
  const className = `badge status-${status.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <span className={className}>
      <StatusIcon status={status} size={14} />
      {status}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const className = `badge priority-${priority.toLowerCase()}`;
  return (
    <span className={className}>
      <PriorityIcon priority={priority} size={14} />
      {priority}
    </span>
  );
};
