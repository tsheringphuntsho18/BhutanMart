import { useEffect, useState } from 'react';
import { adminAPI } from '../api/authAPI';
import { useAuthStore } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Trash2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/pages/Admin.css';

const ROLES = ['customer', 'seller'];

export default function AdminUsers() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllUsers(roleFilter ? { role: roleFilter } : {});
      setUsers(res.data?.data || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const roleColor = { customer: '#3b82f6', seller: '#f59e0b', admin: '#ef4444' };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <Link to="/admin" className="btn-back-link"><ArrowLeft size={16} /> Dashboard</Link>
          <h1>User Management</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="admin-select"
          >
            <option value="">All roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className="btn btn-outline btn-sm" onClick={fetchUsers}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading ? <div className="loading-sm" /> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className={u._id === currentUser?._id ? 'current-user-row' : ''}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-sm">
                        {u.avatar
                          ? <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : u.name?.charAt(0).toUpperCase()}
                      </div>
                      {u.name}
                      {u._id === currentUser?._id && <span className="you-badge">You</span>}
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u._id, e.target.value)}
                      disabled={updatingId === u._id || u._id === currentUser?._id}
                      className="role-select"
                      style={{ borderColor: roleColor[u.role] }}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(u._id, u.name)}
                      disabled={u._id === currentUser?._id}
                      title="Delete user"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="empty-hint" style={{ textAlign: 'center', padding: 32 }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
