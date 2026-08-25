import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { StatusBadge, PriorityBadge } from '../components/Badges';

const STATUSES = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', category: '' });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = { ...filters, page, limit: 10 };
        Object.keys(params).forEach((k) => !params[k] && delete params[k]);
        const res = await api.get('/tickets', { params });
        setTickets(res.data.data);
        setMeta({ page: res.data.page, pages: res.data.pages, total: res.data.total });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tickets');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters, page]);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Tickets</h1>
        <Link to="/tickets/new" className="btn-primary">+ New Ticket</Link>
      </div>

      <div className="filter-bar">
        <input
          placeholder="Search by ticket # or title..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
        />
        <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.priority} onChange={(e) => updateFilter('priority', e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {loading ? (
        <div className="page-loading">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <p className="empty-state">No tickets found.</p>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Title</th>
                <th>Category</th>
                <th>Requester</th>
                <th>Agent</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t._id}>
                  <td>{t.ticketNo}</td>
                  <td>{t.title}</td>
                  <td>{t.category?.name || '—'}</td>
                  <td>{t.requester?.name || '—'}</td>
                  <td>{t.assignedAgent?.name || 'Unassigned'}</td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td><Link to={`/tickets/${t._id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button disabled={meta.page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span>Page {meta.page} of {meta.pages} ({meta.total} total)</span>
            <button disabled={meta.page >= meta.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Tickets;
