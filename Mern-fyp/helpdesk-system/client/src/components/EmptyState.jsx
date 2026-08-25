import { Link } from 'react-router-dom';

const EmptyState = ({ icon: Icon, title, message, action, actionLink, onAction }) => {
  return (
    <div className="empty-state-container">
      {Icon && <Icon size={48} className="empty-state-icon" />}
      <h3>{title}</h3>
      <p>{message}</p>
      {action && actionLink && (
        <Link to={actionLink} className="btn-primary">
          {action}
        </Link>
      )}
      {action && !actionLink && onAction && (
        <button className="btn-primary" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
