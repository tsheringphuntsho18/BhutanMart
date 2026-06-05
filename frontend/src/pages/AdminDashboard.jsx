import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, analyticsAPI } from '../api/authAPI';
import { useAuthStore } from '../context/AuthContext';
import { Users, Package, ShoppingBag, DollarSign, TrendingUp, BarChart2, ArrowRight, Trophy } from 'lucide-react';
import '../styles/pages/Admin.css';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [topBuyers, setTopBuyers] = useState([]);
  const [redisInfo, setRedisInfo] = useState(null);
  const [mongoProfile, setMongoProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      adminAPI.getDashboardStats(),
      analyticsAPI.getTopProducts(),
      analyticsAPI.getUserActivity(),
      analyticsAPI.getTopBuyers(),
      adminAPI.getRedisInfo(),
      adminAPI.getMongoProfile(),
    ]).then(([s, tp, ua, tb, ri, mp]) => {
      if (s.status === 'fulfilled') setStats(s.value.data?.stats || null);
      if (tp.status === 'fulfilled') setTopProducts(tp.value.data?.topProducts || []);
      if (ua.status === 'fulfilled') setUserActivity(ua.value.data?.userActivity || []);
      if (tb.status === 'fulfilled') setTopBuyers(tb.value.data?.topBuyers || []);
      if (ri.status === 'fulfilled') setRedisInfo(ri.value.data?.redisInfo || null);
      if (mp.status === 'fulfilled') setMongoProfile(mp.value.data || null);
    }).finally(() => setLoading(false));
  }, []);

  const statusColors = {
    Placed: '#f59e0b', Confirmed: '#3b82f6', Shipped: '#8b5cf6',
    Delivered: '#10b981', Cancelled: '#ef4444', Returned: '#6b7280',
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="dashboard-avatar admin">
          {user?.avatar
            ? <img src={user.avatar} alt={user?.name} className="dashboard-avatar-img" />
            : user?.name?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1>Admin Dashboard</h1>
          {user && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{user.name} · {user.email}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/analytics" className="btn btn-outline btn-sm">
            <BarChart2 size={16} /> Reports <ArrowRight size={14} />
          </Link>
          <Link to="/admin/orders" className="btn btn-outline btn-sm" title="View all orders (read-only)">
            <Package size={16} /> View Orders <ArrowRight size={14} />
          </Link>
          <Link to="/admin/users" className="btn btn-primary btn-sm">
            <Users size={16} /> Users <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {loading ? <div className="loading-sm" /> : (
        <>
          <div className="admin-stats">
            <div className="stat-card">
              <Users size={28} />
              <div><span className="stat-number">{stats?.totalUsers || 0}</span><span className="stat-label">Total Users</span></div>
            </div>
            <div className="stat-card">
              <Package size={28} />
              <div><span className="stat-number">{stats?.totalProducts || 0}</span><span className="stat-label">Products</span></div>
            </div>
            <div className="stat-card">
              <ShoppingBag size={28} />
              <div><span className="stat-number">{stats?.totalOrders || 0}</span><span className="stat-label">Orders</span></div>
            </div>
            <div className="stat-card">
              <DollarSign size={28} />
              <div><span className="stat-number">Nu. {(stats?.totalRevenue || 0).toLocaleString()}</span><span className="stat-label">Revenue</span></div>
            </div>
          </div>

          {stats?.ordersByStatus && Object.keys(stats.ordersByStatus).length > 0 && (
            <section className="admin-section">
              <h2><BarChart2 size={18} /> Orders by Status</h2>
              <div className="status-grid">
                {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                  <div key={status} className="status-card" style={{ borderLeft: `4px solid ${statusColors[status] || '#6b7280'}` }}>
                    <span className="status-name">{status}</span>
                    <span className="status-count">{count}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="admin-grid">
            <section className="admin-section">
              <h2><TrendingUp size={18} /> Top Products</h2>
              {topProducts.length === 0 ? (
                <p className="empty-hint">No order data yet</p>
              ) : (
                <ul className="admin-list">
                  {topProducts.slice(0, 8).map((p, i) => (
                    <li key={p._id || i} className="admin-list-item">
                      <span className="rank">#{i + 1}</span>
                      <span className="item-name">{p.product?.name || '—'}</span>
                      <span className="item-value">{p.totalSold} sold</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="admin-section">
              <h2><Users size={18} /> Top Customers</h2>
              {userActivity.length === 0 ? (
                <p className="empty-hint">No activity data yet</p>
              ) : (
                <ul className="admin-list">
                  {userActivity.slice(0, 8).map((u, i) => (
                    <li key={u._id || i} className="admin-list-item">
                      <span className="rank">#{i + 1}</span>
                      <span className="item-name">{u.user?.name || '—'}</span>
                      <span className="item-value">Nu. {(u.totalSpent || 0).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Top Buyers Leaderboard (Redis) */}
            <section className="admin-section">
              <h2><Trophy size={18} style={{ color: '#f59e0b' }} /> Top Buyers This Month</h2>
              <p className="empty-hint" style={{ marginBottom: 10, fontSize: 11 }}>From Redis leaderboard</p>
              {topBuyers.length === 0 ? (
                <p className="empty-hint">No purchases this month yet</p>
              ) : (
                <ul className="admin-list">
                  {topBuyers.slice(0, 5).map((b, i) => (
                    <li key={b.userId || i} className="admin-list-item">
                      <span className="rank">#{i + 1}</span>
                      <span className="item-name">{b.name || b.email || '—'}</span>
                      <span className="item-value">Nu. {Number(b.totalSpent || 0).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Observability Panel */}
          <section className="admin-section" style={{ marginTop: 24 }}>
            <h2><BarChart2 size={18} /> Observability</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 12 }}>
              {/* Redis INFO */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>
                  Redis Cache Stats
                </h3>
                {redisInfo ? (
                  <ul className="admin-list">
                    {[
                      ['Version', redisInfo.redis_version],
                      ['Memory Used', redisInfo.used_memory_human],
                      ['Cache Hit Rate', redisInfo.hit_rate],
                      ['Hits', redisInfo.keyspace_hits],
                      ['Misses', redisInfo.keyspace_misses],
                      ['Commands Processed', redisInfo.total_commands_processed],
                      ['AOF Enabled', redisInfo.aof_enabled === '1' ? 'Yes' : 'No'],
                      ['Role', redisInfo.role],
                    ].map(([label, value]) => (
                      <li key={label} className="admin-list-item">
                        <span className="item-name">{label}</span>
                        <span className="item-value" style={{ color: label === 'Cache Hit Rate' ? '#10b981' : undefined }}>
                          {value ?? '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="empty-hint">Redis info unavailable</p>}
              </div>

              {/* MongoDB Profiling */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>
                  MongoDB Slow Query Profiling
                </h3>
                {mongoProfile ? (
                  mongoProfile.atlasOnly ? (
                    <>
                      <ul className="admin-list" style={{ marginBottom: 10 }}>
                        <li className="admin-list-item">
                          <span className="item-name">Profiling Level</span>
                          <span className="item-value">N/A (Atlas M0)</span>
                        </li>
                        <li className="admin-list-item">
                          <span className="item-name">Replica Set</span>
                          <span className="item-value" style={{ color: '#10b981' }}>3 nodes (Atlas)</span>
                        </li>
                        <li className="admin-list-item">
                          <span className="item-name">Write Concern</span>
                          <span className="item-value">majority</span>
                        </li>
                        <li className="admin-list-item">
                          <span className="item-name">Read Preference</span>
                          <span className="item-value">primaryPreferred</span>
                        </li>
                      </ul>
                      <p style={{ fontSize: 11, color: '#9ca3af' }}>
                        Slow query logs available in Atlas UI → Performance Advisor
                      </p>
                    </>
                  ) : (
                    <>
                      <ul className="admin-list" style={{ marginBottom: 12 }}>
                        <li className="admin-list-item">
                          <span className="item-name">Profiling Level</span>
                          <span className="item-value">{mongoProfile.profilingLevel}</span>
                        </li>
                        <li className="admin-list-item">
                          <span className="item-name">Slow Query Threshold</span>
                          <span className="item-value">{mongoProfile.slowMs} ms</span>
                        </li>
                      </ul>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-outline btn-sm"
                          onClick={() => adminAPI.setMongoProfile({ level: 1, slowMs: 100 }).then(() => adminAPI.getMongoProfile().then(r => setMongoProfile(r.data)))}>
                          Enable (100ms)
                        </button>
                        <button className="btn btn-outline btn-sm"
                          onClick={() => adminAPI.setMongoProfile({ level: 0 }).then(() => adminAPI.getMongoProfile().then(r => setMongoProfile(r.data)))}>
                          Disable
                        </button>
                      </div>
                    </>
                  )
                ) : <p className="empty-hint">Loading...</p>}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
