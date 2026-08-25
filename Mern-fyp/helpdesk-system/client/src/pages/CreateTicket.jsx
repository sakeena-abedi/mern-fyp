import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const CreateTicket = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category: '', priority: 'Medium', screenshotUrl: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/categories').then((res) => {
      setCategories(res.data.data);
      if (res.data.data.length > 0) setForm((f) => ({ ...f, category: res.data.data[0]._id }));
    }).catch(() => setError('Failed to load categories'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/tickets', form);
      navigate(`/tickets/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-page">
      <h1>Create New Ticket</h1>
      <form className="panel form-card" onSubmit={handleSubmit}>
        {error && <div className="alert-error">{error}</div>}
        <label>Title</label>
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Short summary of the issue" />

        <label>Description</label>
        <textarea
          required
          rows={5}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe the issue in detail: what happened, when, and any error messages."
        />

        <div className="form-row">
          <div>
            <label>Category</label>
            <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label>Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>
        </div>

        <label>Screenshot URL (optional)</label>
        <input
          value={form.screenshotUrl}
          onChange={(e) => setForm({ ...form, screenshotUrl: e.target.value })}
          placeholder="https://..."
        />

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
};

export default CreateTicket;
