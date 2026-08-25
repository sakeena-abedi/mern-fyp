import { AlertCircle, AlertTriangle, CheckCircle, Clock, Flag, Pause, XCircle } from 'lucide-react';

export const StatusIcon = ({ status, size = 16 }) => {
  const icons = {
    Open: <AlertCircle size={size} className="icon-open" />,
    Assigned: <Pause size={size} className="icon-assigned" />,
    'In Progress': <Clock size={size} className="icon-in-progress" />,
    Resolved: <CheckCircle size={size} className="icon-resolved" />,
    Closed: <XCircle size={size} className="icon-closed" />,
  };
  return icons[status] || null;
};

export const PriorityIcon = ({ priority, size = 16 }) => {
  const icons = {
    Low: <Flag size={size} className="icon-priority-low" />,
    Medium: <Flag size={size} className="icon-priority-medium" />,
    High: <AlertTriangle size={size} className="icon-priority-high" />,
    Urgent: <AlertTriangle size={size} className="icon-priority-urgent" />,
  };
  return icons[priority] || null;
};
