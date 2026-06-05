import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { sellerAPI } from '../api/authAPI';
import toast from 'react-hot-toast';
import { ArrowLeft, RefreshCw, Package } from 'lucide-react';
import '../styles/pages/Dashboard.css';
import '../styles/pages/Admin.css';

const STATUSES = ['Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_COLORS = {
  Placed:    '#f59e0b',
  Confirmed: '#3b82f6',
  Shipped:   '#8b5cf6',
  Delivered: '#10b981',
  Cancelled: '#ef4444',
  Returned:  '#6b7280',
};

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchOrders(); }, [statusFilter, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await sellerAPI.getMyOrders({
        page,
        limit: 20,
        ...(statusFilter && { status: statusFilter }),
      });
      setOrders(res.data.orders || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await sellerAPI.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Order marked as ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <Link to="/dashboard/seller" className="btn-back-link">
            <ArrowLeft size={16} /> Seller Dashboard
          </Link>
          <h1><Package size={22} style={{ verticalAlign: 'middle', marginRight: 8 }} />My Orders</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            Orders containing your products
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="admin-select"
          >
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                      No orders yet
                    </td>
                  </tr>
                )}
                {orders.map(order => (
                  <tr key={order._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: '#e5e7eb', overflow: 'hidden',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, flexShrink: 0,
                        }}>
                          {order.userId?.avatar
                            ? <img src={order.userId.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : order.userId?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 13 }}>
                          <div style={{ fontWeight: 600 }}>{order.userId?.name || '—'}</div>
                          <div style={{ color: '#9ca3af', fontSize: 11 }}>{order.userId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, maxWidth: 200 }}>
                        {order.items?.slice(0, 2).map((item, i) => (
                          <div key={i} style={{ color: '#374151' }}>
                            {item.productId?.name || item.name} ×{item.quantity}
                          </div>
                        ))}
                        {order.items?.length > 2 && (
                          <div style={{ color: '#9ca3af' }}>+{order.items.length - 2} more</div>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>
                      Nu. {order.totalAmount?.toLocaleString()}
                    </td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {['Delivered', 'Cancelled', 'Returned'].includes(order.status) ? (
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                          fontSize: 12, fontWeight: 600, color: '#fff',
                          background: STATUS_COLORS[order.status] || '#6b7280',
                        }}>
                          {order.status}
                        </span>
                      ) : (
                        <select
                          value={order.status}
                          onChange={e => handleStatusChange(order._id, e.target.value)}
                          disabled={updatingId === order._id}
                          className="role-select"
                          style={{ borderColor: STATUS_COLORS[order.status] || '#6b7280' }}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
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
