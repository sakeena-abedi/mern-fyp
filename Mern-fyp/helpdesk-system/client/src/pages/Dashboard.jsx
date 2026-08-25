import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badges';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      }
    };
    load();
  }, []);

  if (error) return <div className="alert-error">{error}</div>;
  if (!data) return <div className="page-loading">Loading dashboard...</div>;

  return (
    <div>
      <h1>Welcome back, {user.name.split(' ')[0]}</h1>
      <p className="page-subtitle">
        {user.role === 'requester' && 'Here is a summary of the tickets you have raised.'}
        {user.role === 'agent' && 'Here is a summary of tickets assigned to you.'}
        {user.role === 'admin' && 'Here is a system-wide summary of all support tickets.'}
      </p>

      <div className="card-grid">
        <div className="stat-card">
          <span className="stat-value">{data.cards.total}</span>
          <span className="stat-label">Total Tickets</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{data.cards.open}</span>
          <span className="stat-label">Open / In Progress</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{data.cards.resolved}</span>
          <span className="stat-label">Resolved</span>
        </div>
        <div className="stat-card stat-alert">
          <span className="stat-value">{data.cards.overdue}</span>
          <span className="stat-label">Overdue</span>
        </div>
      </div>

      <div className="dashboard-columns">
        <div className="panel">
          <h2>By Status</h2>
          <ul className="stat-list">
            {data.byStatus.map((s) => (
              <li key={s._id}>
                <StatusBadge status={s._id} /> <span>{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h2>By Priority</h2>
          <ul className="stat-list">
            {data.byPriority.map((p) => (
              <li key={p._id}>
                <PriorityBadge priority={p._id} /> <span>{p.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel">
        <h2>Recent Activity</h2>
        {data.recentActivity.length === 0 && <p className="empty-state">No tickets yet.</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.recentActivity.map((t) => (
              <tr key={t._id}>
                <td>{t.ticketNo}</td>
                <td>{t.title}</td>
                <td><StatusBadge status={t.status} /></td>
                <td><PriorityBadge priority={t.priority} /></td>
                <td><Link to={`/tickets/${t._id}`}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
