import { useEffect, useState } from 'react';
import api from '../api/axios';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const load = async () => {
    const res = await api.get('/categories', { params: { includeInactive: true } });
    setCategories(res.data.data);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/categories', form);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category');
    }
  };

  const toggleActive = async (cat) => {
    await api.patch(`/categories/${cat._id}`, { isActive: !cat.isActive });
    load();
  };

  return (
    <div>
      <h1>Categories</h1>
      {error && <div className="alert-error">{error}</div>}

      <div className="panel form-card" style={{ maxWidth: 480, marginBottom: 24 }}>
        <h2>Add Category</h2>
        <form onSubmit={handleCreate}>
          <label>Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label>Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button type="submit" className="btn-primary">Add Category</button>
        </form>
      </div>

      <table className="table">
        <thead>
          <tr><th>Name</th><th>Description</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c._id}>
              <td>{c.name}</td>
              <td>{c.description}</td>
              <td>{c.isActive ? 'Active' : 'Inactive'}</td>
              <td><button className="btn-link" onClick={() => toggleActive(c)}>{c.isActive ? 'Deactivate' : 'Activate'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Categories;
