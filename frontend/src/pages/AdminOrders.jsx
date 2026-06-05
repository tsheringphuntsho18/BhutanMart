import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/authAPI';
import toast from 'react-hot-toast';
import { ArrowLeft, RefreshCw, Package } from 'lucide-react';
import '../styles/pages/Admin.css';

const STATUS_COLORS = {
  Placed:    '#f59e0b',
  Confirmed: '#3b82f6',
  Shipped:   '#8b5cf6',
  Delivered: '#10b981',
  Cancelled: '#ef4444',
  Returned:  '#6b7280',
};

const ALL_STATUSES = ['Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchOrders(); }, [statusFilter, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch all orders as admin (use admin endpoint)
      const res = await api.get('/admin/orders', {
        params: { page, limit: 20, ...(statusFilter && { status: statusFilter }) },
      });
      setOrders(res.data.orders || res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <Link to="/admin" className="btn-back-link"><ArrowLeft size={16} /> Dashboard</Link>
          <h1><Package size={22} style={{ verticalAlign: 'middle', marginRight: 8 }} />Order Management</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="admin-select"
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-outline btn-sm" onClick={fetchOrders}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading ? <div className="loading-sm" /> : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>No orders found</td></tr>
                )}
                {orders.map(order => (
                  <tr key={order._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>
                        <div style={{ fontWeight: 600 }}>{order.userId?.name || '—'}</div>
                        <div style={{ color: '#9ca3af' }}>{order.userId?.email || ''}</div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                    </td>
                    <td style={{ fontWeight: 600 }}>Nu. {order.totalAmount?.toLocaleString()}</td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                        fontSize: 12, fontWeight: 600, color: '#fff',
                        background: STATUS_COLORS[order.status] || '#6b7280',
                      }}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
              <span style={{ alignSelf: 'center', fontSize: 13 }}>Page {page} of {totalPages}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
