import { useEffect, useState } from 'react';
import api from '../api/axios';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    const res = await api.get('/users');
    setUsers(res.data.data);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (u) => {
    setError('');
    try {
      await api.patch(`/users/${u._id}`, { isActive: !u.isActive });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const changeRole = async (u, role) => {
    setError('');
    try {
      await api.patch(`/users/${u._id}`, { role });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div>
      <h1>Users</h1>
      {error && <div className="alert-error">{error}</div>}
      <table className="table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <select value={u.role} onChange={(e) => changeRole(u, e.target.value)}>
                  <option value="requester">requester</option>
                  <option value="agent">agent</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>{u.isActive ? 'Active' : 'Deactivated'}</td>
              <td><button className="btn-link" onClick={() => toggleActive(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
