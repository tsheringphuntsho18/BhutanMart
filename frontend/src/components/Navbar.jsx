import { useState } from 'react';
import { useAuthStore } from '../context/AuthContext';
import { useCartStore } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, LogOut, Home } from 'lucide-react';
import '../styles/components/Navbar.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { items } = useCartStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🏪 BhutanMart
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-item" onClick={() => setIsOpen(false)}>
            <Home size={18} /> Home
          </Link>
          <Link to="/products" className="nav-item" onClick={() => setIsOpen(false)}>
            Products
          </Link>

          {user ? (
            <>
              <Link to="/orders" className="nav-item" onClick={() => setIsOpen(false)}>
                Orders
              </Link>
              <Link to="/profile" className="nav-item" onClick={() => setIsOpen(false)}>
                <User size={18} /> Profile
              </Link>
            </>
          ) : null}
        </div>

        <div className="navbar-actions">
          <Link to="/cart" className="cart-link">
            <ShoppingCart size={24} />
            {items.length > 0 && (
              <span className="cart-badge">{items.length}</span>
            )}
          </Link>

          {user ? (
            <div className="user-menu">
              <span className="user-name">{user.name}</span>
              <button onClick={handleLogout} className="btn-logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
