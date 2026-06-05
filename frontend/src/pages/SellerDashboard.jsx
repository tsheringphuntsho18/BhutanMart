import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../context/AuthContext';
import { analyticsAPI, sellerAPI } from '../api/authAPI';
import { TrendingUp, Package, DollarSign, BarChart2, ArrowRight, ShoppingBag, Plus, ClipboardList, AlertTriangle, Users, Trophy } from 'lucide-react';
import '../styles/pages/Dashboard.css';

const STATUS_COLORS = {
  Placed: '#f59e0b', Confirmed: '#3b82f6', Shipped: '#8b5cf6',
  Delivered: '#10b981', Cancelled: '#ef4444', Returned: '#6b7280',
};

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const [revenueStats, setRevenueStats] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [topBuyers, setTopBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noProfile, setNoProfile] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      analyticsAPI.getMonthlyRevenue({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      }),
      sellerAPI.getMyProducts({ page: 1, limit: 6 }),
      sellerAPI.getMyOrders({ page: 1, limit: 5 }),
      analyticsAPI.getTopProducts(),
      analyticsAPI.getUserActivity(),
      analyticsAPI.getTopBuyers(),
    ]).then(([rev, prods, orders, tp, tc, tb]) => {
      if (rev.status === 'fulfilled') setRevenueStats(rev.value.data?.data || null);
      if (prods.status === 'fulfilled') {
        setMyProducts(prods.value.data?.products || []);
        if (prods.value.data?.noProfile) setNoProfile(true);
      }
      if (orders.status === 'fulfilled') setRecentOrders(orders.value.data?.orders || []);
      if (tp.status === 'fulfilled') setTopProducts(tp.value.data?.topProducts || []);
      if (tc.status === 'fulfilled') setTopCustomers(tc.value.data?.userActivity || []);
      if (tb.status === 'fulfilled') setTopBuyers(tb.value.data?.topBuyers || []);
    }).finally(() => setLoading(false));
  }, []);

  const lowStockProducts = myProducts.filter(p => (p.inventoryStock ?? p.stock) <= 10);

  if (noProfile) return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-avatar seller">
          {user.avatar ? <img src={user.avatar} alt={user.name} className="dashboard-avatar-img" /> : user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1>Complete Your Seller Profile</h1>
          <p className="dashboard-subtitle">Set up your store to start selling</p>
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <ShoppingBag size={60} style={{ color: '#f59e0b', marginBottom: 16 }} />
        <h2 style={{ marginBottom: 8 }}>Your seller profile is not set up yet</h2>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>Create your store name and start listing products.</p>
        <Link to="/seller/setup" className="btn btn-primary">Set Up My Store</Link>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-avatar seller">
          {user.avatar
            ? <img src={user.avatar} alt={user.name} className="dashboard-avatar-img" />
            : user.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1>Seller Dashboard</h1>
          <p className="dashboard-subtitle">{user.name} · {user.email}</p>
          <span className="role-badge seller">Seller</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/analytics" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <BarChart2 size={16} /> Reports
          </Link>
          <Link to="/dashboard/seller/orders" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <ClipboardList size={16} /> My Orders
          </Link>
          <Link to="/dashboard/seller/add-product" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <Plus size={18} /> Add Product
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <DollarSign size={28} />
          <div>
            <span className="stat-number">Nu. {(revenueStats?.totalRevenue || 0).toLocaleString()}</span>
            <span className="stat-label">Revenue (This Month)</span>
          </div>
        </div>
        <div className="stat-card">
          <ClipboardList size={28} />
          <div>
            <span className="stat-number">{recentOrders.length}</span>
            <span className="stat-label">Recent Orders</span>
          </div>
        </div>
        <div className="stat-card">
          <Package size={28} />
          <div>
            <span className="stat-number">{myProducts.length}</span>
            <span className="stat-label">My Products</span>
          </div>
        </div>
        <div className="stat-card">
          <AlertTriangle size={28} />
          <div>
            <span className="stat-number" style={{ color: lowStockProducts.length > 0 ? '#ef4444' : 'inherit' }}>
              {lowStockProducts.length}
            </span>
            <span className="stat-label">Low Stock</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* My Products */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2><Package size={20} /> My Products</h2>
            <Link to="/dashboard/seller/add-product" className="btn btn-outline btn-sm">
              <Plus size={14} /> Add <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? <div className="loading-sm" /> : myProducts.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={40} />
              <p>No products listed yet</p>
              <Link to="/dashboard/seller/add-product" className="btn btn-primary btn-sm">Add First Product</Link>
            </div>
          ) : (
            <ul className="order-list">
              {myProducts.map((p, i) => (
                <li key={p._id || i} className="order-item">
                  <div className="order-info" style={{ gap: 8 }}>
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt={p.name} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{p.categoryId?.name}</div>
                    </div>
                  </div>
                  <div className="order-meta">
                    <span className="order-total">Nu. {p.price?.toLocaleString()}</span>
                    <span className="order-status" style={{ background: (p.inventoryStock ?? p.stock) <= 10 ? '#ef4444' : '#10b981' }}>
                      {p.inventoryStock ?? p.stock} in stock
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent Orders */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2><ClipboardList size={20} /> Recent Orders</h2>
            <Link to="/dashboard/seller/orders" className="btn btn-outline btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? <div className="loading-sm" /> : recentOrders.length === 0 ? (
            <div className="empty-state">
              <ClipboardList size={40} />
              <p>No orders yet</p>
            </div>
          ) : (
            <ul className="order-list">
              {recentOrders.map((order, i) => (
                <li key={order._id || i} className="order-item">
                  <div className="order-info">
                    <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{order.userId?.name}</span>
                  </div>
                  <div className="order-meta">
                    <span className="order-total">Nu. {order.totalAmount?.toLocaleString()}</span>
                    <span className="order-status" style={{ background: STATUS_COLORS[order.status] || '#6b7280' }}>
                      {order.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Revenue Summary */}
        <section className="dashboard-section">
          <h2><BarChart2 size={20} /> Revenue Summary</h2>
          {loading ? <div className="loading-sm" /> : !revenueStats ? (
            <div className="empty-state"><BarChart2 size={40} /><p>No revenue data yet</p></div>
          ) : (
            <ul className="order-list">
              <li className="order-item"><span>Total Revenue</span><span className="order-total">Nu. {(revenueStats.totalRevenue || 0).toLocaleString()}</span></li>
              <li className="order-item"><span>Total Orders</span><span className="order-total">{revenueStats.totalOrders || 0}</span></li>
              <li className="order-item"><span>Avg Order Value</span><span className="order-total">Nu. {(revenueStats.avgOrderValue || 0).toLocaleString()}</span></li>
            </ul>
          )}
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
      </div>
    </div>
  );
}
