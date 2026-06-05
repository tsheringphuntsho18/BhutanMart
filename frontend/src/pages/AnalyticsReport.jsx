import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI } from '../api/authAPI';
import { useAuthStore } from '../context/AuthContext';
import { ArrowLeft, TrendingUp, AlertTriangle, Eye, ShoppingBag, BarChart2, Calendar, RefreshCw } from 'lucide-react';
import '../styles/pages/Admin.css';

const now = new Date();

export default function AnalyticsReport() {
  const { user } = useAuthStore();
  const backLink = user?.role === 'admin' ? '/admin' : '/dashboard/seller';
  const backLabel = user?.role === 'admin' ? 'Admin Dashboard' : 'Seller Dashboard';

  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(now.getFullYear()));

  const [monthly, setMonthly] = useState(null);
  const [daily, setDaily] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [viewedVsPurchased, setViewedVsPurchased] = useState([]);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [loadingStatic, setLoadingStatic] = useState(true);

  // Load static reports once
  useEffect(() => {
    Promise.allSettled([
      analyticsAPI.getLowStockProducts(),
      analyticsAPI.getMostViewedVsPurchased(),
    ]).then(([ls, vp]) => {
      if (ls.status === 'fulfilled') setLowStock(ls.value.data?.lowStockProducts || []);
      if (vp.status === 'fulfilled') setViewedVsPurchased(vp.value.data?.analysis || []);
    }).finally(() => setLoadingStatic(false));
  }, []);

  // Load revenue reports when month/year changes
  useEffect(() => {
    fetchRevenue();
  }, [month, year]);

  const fetchRevenue = async () => {
    setLoadingRevenue(true);
    try {
      const [mRes, dRes] = await Promise.all([
        analyticsAPI.getMonthlyRevenue({ month, year }),
        analyticsAPI.getDailySalesReport({ month, year }),
      ]);
      setMonthly(mRes.data?.data || null);
      setDaily(dRes.data?.dailyReport || []);
    } catch {
      setMonthly(null);
      setDaily([]);
    } finally {
      setLoadingRevenue(false);
    }
  };

  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const years = Array.from({ length: 3 }, (_, i) => String(now.getFullYear() - i));

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <Link to={backLink} className="btn-back-link"><ArrowLeft size={16} /> {backLabel}</Link>
          <h1><BarChart2 size={22} style={{ verticalAlign: 'middle', marginRight: 8 }} />Analytics & Reports</h1>
        </div>
      </div>

      {/* Month / Year Selector */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
        <Calendar size={18} style={{ color: '#6b7280' }} />
        <select value={month} onChange={e => setMonth(e.target.value)} className="admin-select">
          {MONTHS.map((m, i) => (
            <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
          ))}
        </select>
        <select value={year} onChange={e => setYear(e.target.value)} className="admin-select">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button className="btn btn-outline btn-sm" onClick={fetchRevenue}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Monthly Revenue Summary ── */}
      <section className="admin-section" style={{ marginBottom: 24 }}>
        <h2><TrendingUp size={18} /> Monthly Sales Summary — {MONTHS[parseInt(month) - 1]} {year}</h2>
        {loadingRevenue ? <div className="loading-sm" /> : !monthly ? (
          <p className="empty-hint">No orders in this period</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginTop: 12 }}>
            {[
              { label: 'Total Revenue', value: `Nu. ${(monthly.totalRevenue || 0).toLocaleString()}` },
              { label: 'Total Orders', value: monthly.totalOrders || 0 },
              { label: 'Avg Order Value', value: `Nu. ${Math.round(monthly.avgOrderValue || 0).toLocaleString()}` },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: '#f9fafb', border: '1px solid #e5e7eb',
                borderRadius: 12, padding: '16px 20px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{value}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Daily Sales Breakdown ── */}
      <section className="admin-section" style={{ marginBottom: 24 }}>
        <h2><BarChart2 size={18} /> Daily Sales — {MONTHS[parseInt(month) - 1]} {year}</h2>
        {loadingRevenue ? <div className="loading-sm" /> : daily.length === 0 ? (
          <p className="empty-hint">No daily data for this period</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {daily.map(row => (
                  <tr key={row._id}>
                    <td style={{ fontWeight: 600 }}>{row._id}</td>
                    <td>{row.ordersCount}</td>
                    <td style={{ fontWeight: 600, color: '#10b981' }}>Nu. {(row.dailyRevenue || 0).toLocaleString()}</td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr style={{ background: '#f0fdf4', fontWeight: 700 }}>
                  <td>Total</td>
                  <td>{daily.reduce((s, r) => s + r.ordersCount, 0)}</td>
                  <td style={{ color: '#10b981' }}>
                    Nu. {daily.reduce((s, r) => s + r.dailyRevenue, 0).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Low Stock Alerts ── */}
      <section className="admin-section" style={{ marginBottom: 24 }}>
        <h2><AlertTriangle size={18} style={{ color: '#ef4444' }} /> Low Stock Alerts</h2>
        {loadingStatic ? <div className="loading-sm" /> : lowStock.length === 0 ? (
          <p className="empty-hint">All products are adequately stocked</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Threshold</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item, i) => (
                  <tr key={item._id || i}>
                    <td style={{ fontWeight: 600 }}>{item.product?.name || '—'}</td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>{item.stock}</td>
                    <td style={{ color: '#6b7280' }}>{item.lowStockThreshold}</td>
                    <td>
                      <span style={{
                        background: item.stock === 0 ? '#7f1d1d' : '#fef2f2',
                        color: item.stock === 0 ? '#fff' : '#ef4444',
                        padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      }}>
                        {item.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Most Viewed vs Most Purchased ── */}
      <section className="admin-section">
        <h2><Eye size={18} /> Most Viewed vs Most Purchased</h2>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
          Unique views from Redis HyperLogLog · Purchases from MongoDB aggregation
        </p>
        {loadingStatic ? <div className="loading-sm" /> : viewedVsPurchased.length === 0 ? (
          <p className="empty-hint">No product data yet</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th><Eye size={13} /> Unique Views</th>
                  <th><ShoppingBag size={13} /> Total Purchased</th>
                  <th>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {viewedVsPurchased.map((p, i) => {
                  const conversion = p.uniqueViews > 0
                    ? ((p.totalPurchased / p.uniqueViews) * 100).toFixed(1)
                    : '—';
                  return (
                    <tr key={p.productId || i}>
                      <td style={{ color: '#9ca3af', fontWeight: 600 }}>#{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{p.name || '—'}</td>
                      <td>{p.uniqueViews}</td>
                      <td style={{ fontWeight: 600, color: '#3b82f6' }}>{p.totalPurchased}</td>
                      <td>
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: parseFloat(conversion) >= 10 ? '#10b981' : '#f59e0b',
                        }}>
                          {conversion}{conversion !== '—' ? '%' : ''}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
