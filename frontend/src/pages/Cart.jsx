import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../context/CartContext';
import { useAuthStore } from '../context/AuthContext';
import { orderAPI } from '../api/authAPI';
import toast from 'react-hot-toast';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import '../styles/pages/Cart.css';

export default function Cart() {
  const { items, removeFromCart, updateCartItem, clearCart, fetchCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCart(); // works for both logged-in (user cart) and guest (guest cart)
  }, [user]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please log in to place an order');
      navigate('/login');
      return;
    }
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name || '',
          quantity: item.quantity,
          price: item.price,
        })),
        paymentMethod: 'COD',
      };

      await orderAPI.placeOrder(orderData);
      toast.success('Order placed successfully!');
      await clearCart();
      navigate('/orders');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <ShoppingBag size={80} />
          <h1>Your cart is empty</h1>
          <p>Browse our products and add something you like!</p>
          <Link to="/products" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1>Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})</h1>

        <div className="cart-content">
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.productId} className="cart-item">
                <div className="item-image">
                  <img
                    src={item.image || '/images/placeholder.png'}
                    alt={item.name || 'Product'}
                  />
                </div>

                <div className="item-details">
                  <h3>{item.name || `Product #${item.productId?.substring(0, 8)}`}</h3>
                  <p className="price">Nu. {item.price.toLocaleString()}</p>
                </div>

                <div className="item-quantity">
                  <button onClick={() => updateCartItem(item.productId, Math.max(1, item.quantity - 1))}>
                    <Minus size={14} />
                  </button>
                  <input type="number" value={item.quantity} readOnly />
                  <button onClick={() => updateCartItem(item.productId, item.quantity + 1)}>
                    <Plus size={14} />
                  </button>
                </div>

                <div className="item-total">
                  Nu. {(item.price * item.quantity).toLocaleString()}
                </div>

                <button className="btn-remove" onClick={() => removeFromCart(item.productId)}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal:</span>
              <span>Nu. {total.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span>Nu. 100</span>
            </div>
            <div className="summary-row">
              <span>Tax (5%):</span>
              <span>Nu. {Math.round(total * 0.05).toLocaleString()}</span>
            </div>

            <div className="summary-total">
              <span>Total:</span>
              <span>Nu. {(total + 100 + Math.round(total * 0.05)).toLocaleString()}</span>
            </div>

            <button
              className="btn btn-primary checkout-btn"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Checkout (COD)'}
            </button>

            <button className="btn btn-outline" onClick={clearCart}>
              Clear Cart
            </button>

            <Link to="/products" className="continue-shopping">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
