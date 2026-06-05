import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../context/AuthContext';
import { orderAPI, productAPI, analyticsAPI } from '../api/authAPI';
import { ShoppingBag, Heart, MapPin, Clock, ArrowRight, Package, Eye, TrendingUp, Users, Trophy } from 'lucide-react';
import '../styles/pages/Dashboard.css';

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [topBuyers, setTopBuyers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      orderAPI.getUserOrders(),
      productAPI.getRecentlyViewed(),
      analyticsAPI.getTopProducts(),
      analyticsAPI.getUserActivity(),
      analyticsAPI.getTopBuyers(),
    ]).then(([ordersRes, rvRes, tpRes, tcRes, tbRes]) => {
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data.orders || []);
      if (rvRes.status === 'fulfilled') setRecentlyViewed(rvRes.value.data.products || []);
      if (tpRes.status === 'fulfilled') setTopProducts(tpRes.value.data?.topProducts || []);
      if (tcRes.status === 'fulfilled') setTopCustomers(tcRes.value.data?.userActivity || []);
      if (tbRes.status === 'fulfilled') setTopBuyers(tbRes.value.data?.topBuyers || []);
    }).finally(() => setLoading(false));
  }, []);

  const statusColor = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444',
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-avatar">
          {user.avatar
            ? <img src={user.avatar} alt={user.name} className="dashboard-avatar-img" />
            : user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1>Welcome back, {user.name}!</h1>
          <span className="role-badge customer">Customer</span>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <Package size={28} />
          <div>
            <span className="stat-number">{orders.length}</span>
            <span className="stat-label">Total Orders</span>
          </div>
        </div>
        <div className="stat-card">
          <Heart size={28} />
          <div>
            <span className="stat-number">{user.wishlist?.length || 0}</span>
            <span className="stat-label">Wishlist Items</span>
          </div>
        </div>
        <div className="stat-card">
          <MapPin size={28} />
          <div>
            <span className="stat-number">{user.addresses?.length || 0}</span>
            <span className="stat-label">Saved Addresses</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-section">
          <div className="section-header">
            <h2><Clock size={20} /> Recent Orders</h2>
            <Link to="/orders" className="btn btn-outline btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="loading-sm"></div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={40} />
              <p>No orders yet</p>
              <Link to="/products" className="btn btn-primary btn-sm">Start Shopping</Link>
            </div>
          ) : (
            <ul className="order-list">
              {orders.slice(0, 5).map(order => (
                <li key={order._id} className="order-item">
                  <div className="order-info">
                    <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                    <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="order-meta">
                    <span className="order-total">Nu. {order.totalAmount?.toLocaleString()}</span>
                    <span
                      className="order-status"
                      style={{ background: statusColor[order.status] || '#6b7280' }}
                    >
                      {order.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/products" className="action-card">
              <ShoppingBag size={24} />
              <span>Browse Products</span>
            </Link>
            <Link to="/orders" className="action-card">
              <Package size={24} />
              <span>My Orders</span>
            </Link>
            <Link to="/cart" className="action-card">
              <ShoppingBag size={24} />
              <span>My Cart</span>
            </Link>
            <Link to="/profile" className="action-card">
              <MapPin size={24} />
              <span>My Profile</span>
            </Link>
          </div>
        </section>

        {/* Top Products */}
        <section className="dashboard-section">
          <h2><TrendingUp size={20} /> Top Products</h2>
          {loading ? <div className="loading-sm" /> : topProducts.length === 0 ? (
            <p className="empty-hint" style={{ padding: '12px 0' }}>No data yet</p>
          ) : (
            <ul className="order-list">
              {topProducts.slice(0, 5).map((p, i) => (
                <li key={p._id || i} className="order-item">
                  <div className="order-info">
                    <span className="order-id">#{i + 1}</span>
                    <span>{p.product?.name || '—'}</span>
                  </div>
                  <span className="order-total">{p.totalSold} sold</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Top Customers */}
        <section className="dashboard-section">
          <h2><Users size={20} /> Top Customers</h2>
          {loading ? <div className="loading-sm" /> : topCustomers.length === 0 ? (
            <p className="empty-hint" style={{ padding: '12px 0' }}>No data yet</p>
          ) : (
            <ul className="order-list">
              {topCustomers.slice(0, 5).map((c, i) => (
                <li key={c._id || i} className="order-item">
                  <div className="order-info">
                    <span className="order-id">#{i + 1}</span>
                    <span>{c.user?.name || '—'}</span>
                  </div>
                  <span className="order-total">Nu. {(c.totalSpent || 0).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Top Buyers This Month */}
        <section className="dashboard-section">
          <h2><Trophy size={20} /> Top Buyers This Month</h2>
          {loading ? <div className="loading-sm" /> : topBuyers.length === 0 ? (
            <p className="empty-hint" style={{ padding: '12px 0' }}>No purchases this month yet</p>
          ) : (
            <ul className="order-list">
              {topBuyers.slice(0, 5).map((b, i) => (
                <li key={b.userId || i} className="order-item">
                  <div className="order-info">
                    <span className="order-id">#{i + 1}</span>
                    <span>{b.name || b.email || '—'}</span>
                  </div>
                  <span className="order-total">Nu. {Number(b.totalSpent || 0).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {recentlyViewed.length > 0 && (
          <section className="dashboard-section" style={{ gridColumn: '1 / -1' }}>
            <div className="section-header">
              <h2><Eye size={20} /> Recently Viewed</h2>
              <Link to="/products" className="btn btn-outline btn-sm">Browse More <ArrowRight size={14} /></Link>
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
              {recentlyViewed.slice(0, 6).map(p => (
                <Link
                  key={p._id}
                  to={`/products/${p._id}`}
                  style={{ textDecoration: 'none', flexShrink: 0, width: 140 }}
                >
                  <div style={{
                    background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10,
                    overflow: 'hidden', transition: 'box-shadow 0.2s',
                  }}>
                    <img
                      src={p.imageUrl || '/images/placeholder.png'}
                      alt={p.name}
                      style={{ width: '100%', height: 100, objectFit: 'cover' }}
                      onError={e => { e.target.src = '/images/placeholder.png'; }}
                    />
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#111', lineHeight: 1.3, marginBottom: 4 }}>
                        {p.name.length > 28 ? p.name.slice(0, 28) + '…' : p.name}
                      </div>
                      <div style={{ fontSize: 13, color: '#e85d04', fontWeight: 700 }}>
                        Nu. {p.price?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
