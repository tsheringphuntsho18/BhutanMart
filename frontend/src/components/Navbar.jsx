import { useState } from 'react';
import { useAuthStore } from '../context/AuthContext';
import { useCartStore } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, LogOut, Home, LayoutDashboard } from 'lucide-react';
import '../styles/components/Navbar.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { items } = useCartStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    logout();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          BhutanMart
        </Link>

        <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-item" onClick={() => setIsOpen(false)}>
            <Home size={18} /> Home
          </Link>
          <Link to="/products" className="nav-item" onClick={() => setIsOpen(false)}>
            Products
          </Link>

          {user && (
            <>
              <Link
                to={user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/dashboard/seller' : '/dashboard/customer'}
                className="nav-item"
                onClick={() => setIsOpen(false)}
              >
                <LayoutDashboard size={18} /> Dashboard
              </Link>

              {user.role !== 'admin' && (
                <Link to="/orders" className="nav-item" onClick={() => setIsOpen(false)}>
                  Orders
                </Link>
              )}
            </>
          )}
        </div>

        <div className="navbar-actions">
          {(!user || user.role !== 'admin') && (
            <Link to="/cart" className="cart-link">
              <ShoppingCart size={24} />
              {items.length > 0 && (
                <span className="cart-badge">{items.length}</span>
              )}
            </Link>
          )}

          {user ? (
            <div className="user-menu">
              {/* Clickable avatar — goes to profile */}
              <button
                className="nav-avatar"
                onClick={() => navigate('/profile')}
                title={`${user.name} — View profile`}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="nav-avatar-img" />
                ) : (
                  <span className="nav-avatar-initials">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              <button onClick={handleLogout} className="btn-logout" title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
