import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../api/authAPI';
import toast from 'react-hot-toast';
import { Package, Clock, CheckCircle, XCircle, ShoppingBag } from 'lucide-react';
import '../styles/pages/Orders.css';

const STATUS_COLORS = {
  Placed:    'badge-warning',
  Confirmed: 'badge-info',
  Shipped:   'badge-info',
  Delivered: 'badge-success',
  Cancelled: 'badge-error',
  Returned:  'badge-error',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getUserOrders();
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const props = { size: 18 };
    switch (status) {
      case 'Delivered': return <CheckCircle {...props} className="status-icon success" />;
      case 'Cancelled':
      case 'Returned':  return <XCircle {...props} className="status-icon error" />;
      case 'Shipped':   return <Package {...props} className="status-icon info" />;
      default:          return <Clock {...props} className="status-icon pending" />;
    }
  };

  const getProductName = (item) => {
    if (item.name) return item.name;
    if (item.productId && typeof item.productId === 'object') {
      return item.productId.name || 'Product';
    }
    return `Product #${String(item.productId).substring(0, 8).toUpperCase()}`;
  };

  if (loading) return <div className="loading"></div>;

  return (
    <div className="orders-page">
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <div className="no-orders">
          <Package size={72} />
          <p>You haven't placed any orders yet</p>
          <Link to="/products" className="btn btn-primary">
            <ShoppingBag size={18} /> Start Shopping
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-id">
                  <h3>Order #{order._id.substring(0, 10).toUpperCase()}</h3>
                  <p>{new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}</p>
                </div>
                <div className="order-status">
                  {getStatusIcon(order.status)}
                  <span className={`badge ${STATUS_COLORS[order.status] || 'badge-warning'}`}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="order-items">
                <h4>Items ({order.items.length})</h4>
                {order.items.map((item, i) => (
                  <div key={i} className="order-item">
                    <span className="item-name">{getProductName(item)}</span>
                    <span className="item-qty">x{item.quantity}</span>
                    <span className="item-price">
                      Nu. {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  Total: <strong>Nu. {order.totalAmount?.toLocaleString() || order.total?.toLocaleString()}</strong>
                </div>
                <span className="badge badge-info">{order.paymentMethod || 'COD'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
