import { Facebook, Twitter, Instagram, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/components/Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>BhutanMart</h3>
          <p>Your trusted online marketplace for authentic Bhutanese products</p>
          <div className="social-links">
            <a href="#" title="Facebook"><Facebook size={20} /></a>
            <a href="#" title="Twitter"><Twitter size={20} /></a>
            <a href="#" title="Instagram"><Instagram size={20} /></a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/orders">Orders</Link></li>
            <li><a href="#about">About Us</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Customer Service</h4>
          <ul>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#returns">Returns</a></li>
            <li><a href="#shipping">Shipping</a></li>
            <li><a href="#contact">Contact Us</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact Info</h4>
          <p>
            <Phone size={16} />
            +975 1234 5678
          </p>
          <p>
            <Mail size={16} />
            support@bhutanmart.com
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 BhutanMart. All rights reserved.</p>
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
