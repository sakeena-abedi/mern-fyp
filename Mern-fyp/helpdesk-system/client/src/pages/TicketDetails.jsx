import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badges';

const NEXT_STATUS_OPTIONS = {
  Open: ['Assigned', 'In Progress'],
  Assigned: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['Closed'],
  Closed: [],
};

const TicketDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(true);

  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [nextStatus, setNextStatus] = useState('');
  const [resolution, setResolution] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ticketRes, commentsRes, historyRes] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/tickets/${id}/comments`),
        api.get(`/tickets/${id}/history`),
      ]);
      setTicket(ticketRes.data.data);
      setComments(commentsRes.data.data);
      setHistory(historyRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (user.role === 'admin') {
      api.get('/users', { params: { role: 'agent' } }).then((res) => setAgents(res.data.data)).catch(() => {});
    }
  }, [user.role]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setActionError('');
    try {
      await api.post(`/tickets/${id}/comments`, { message: commentText, isInternal });
      setCommentText('');
      setIsInternal(false);
      loadAll();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedAgent) return;
    setActionError('');
    try {
      await api.patch(`/tickets/${id}/assign`, { agentId: selectedAgent });
      loadAll();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to assign ticket');
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!nextStatus) return;
    setActionError('');
    try {
      await api.patch(`/tickets/${id}/status`, { status: nextStatus, resolution });
      setNextStatus('');
      setResolution('');
      loadAll();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleReopen = async () => {
    setActionError('');
    try {
      await api.patch(`/tickets/${id}/status`, { status: 'In Progress', note: 'Reopened by requester' });
      loadAll();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reopen ticket');
    }
  };

  if (loading) return <div className="page-loading">Loading ticket...</div>;
  if (error) return <div className="alert-error">{error}</div>;
  if (!ticket) return null;

  const isAssignedAgent = user.role === 'agent' && ticket.assignedAgent?._id === user.id;
  const isAdmin = user.role === 'admin';
  const isOwner = user.role === 'requester' && ticket.requester?._id === user.id;
  const canChangeStatus = isAssignedAgent || isAdmin;
  const availableNext = NEXT_STATUS_OPTIONS[ticket.status] || [];

  return (
    <div>
      <Link to="/tickets" className="back-link">← Back to Tickets</Link>

      <div className="ticket-header">
        <div>
          <h1>{ticket.title}</h1>
          <p className="ticket-meta">{ticket.ticketNo} · Opened {new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
        <div className="ticket-badges">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {actionError && <div className="alert-error">{actionError}</div>}

      <div className="ticket-layout">
        <div className="ticket-main">
          <div className="panel">
            <h2>Description</h2>
            <p className="ticket-description">{ticket.description}</p>
            {ticket.screenshotUrl && (
              <p><a href={ticket.screenshotUrl} target="_blank" rel="noreferrer">View attached screenshot</a></p>
            )}
            {ticket.resolution && (
              <>
                <h3>Resolution</h3>
                <p className="ticket-description">{ticket.resolution}</p>
              </>
            )}
          </div>

          <div className="panel">
            <h2>Comments</h2>
            {comments.length === 0 && <p className="empty-state">No comments yet.</p>}
            <ul className="comment-list">
              {comments.map((c) => (
                <li key={c._id} className={c.isInternal ? 'comment-internal' : ''}>
                  <div className="comment-meta">
                    <strong>{c.author?.name}</strong> <span className="badge-role-sm">{c.author?.role}</span>
                    {c.isInternal && <span className="badge-internal">Internal</span>}
                    <span className="comment-date">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p>{c.message}</p>
                </li>
              ))}
            </ul>

            {ticket.status !== 'Closed' && (
              <form onSubmit={handleComment} className="comment-form">
                <textarea
                  rows={3}
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="comment-form-actions">
                  {user.role !== 'requester' && (
                    <label className="checkbox-label">
                      <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                      Internal note (not visible to requester)
                    </label>
                  )}
                  <button type="submit" className="btn-secondary">Post Comment</button>
                </div>
              </form>
            )}
          </div>

          <div className="panel">
            <h2>Status History</h2>
            <ul className="history-list">
              {history.map((h) => (
                <li key={h._id}>
                  <span>{h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : `Created as ${h.toStatus}`}</span>
                  <span className="history-meta">by {h.changedBy?.name} on {new Date(h.createdAt).toLocaleString()}</span>
                  {h.note && <p className="history-note">{h.note}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="ticket-sidebar">
          <div className="panel">
            <h2>Details</h2>
            <dl className="detail-list">
              <dt>Requester</dt><dd>{ticket.requester?.name}</dd>
              <dt>Assigned Agent</dt><dd>{ticket.assignedAgent?.name || 'Unassigned'}</dd>
              <dt>Category</dt><dd>{ticket.category?.name}</dd>
              <dt>Last Updated</dt><dd>{new Date(ticket.updatedAt).toLocaleString()}</dd>
            </dl>
          </div>

          {isAdmin && (
            <div className="panel">
              <h2>Assign Agent</h2>
              <form onSubmit={handleAssign}>
                <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
                  <option value="">Select agent...</option>
                  {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
                <button type="submit" className="btn-secondary full-width">Assign</button>
              </form>
            </div>
          )}

          {canChangeStatus && availableNext.length > 0 && (
            <div className="panel">
              <h2>Update Status</h2>
              <form onSubmit={handleStatusUpdate}>
                <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                  <option value="">Select new status...</option>
                  {availableNext.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {nextStatus === 'Resolved' && (
                  <textarea
                    rows={3}
                    placeholder="Resolution notes (required)"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                  />
                )}
                <button type="submit" className="btn-primary full-width">Update Status</button>
              </form>
            </div>
          )}

          {isOwner && ticket.status === 'Resolved' && (
            <div className="panel">
              <h2>Not fixed?</h2>
              <p className="ticket-meta">If the issue persists, you can reopen this ticket.</p>
              <button onClick={handleReopen} className="btn-secondary full-width">Reopen Ticket</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
