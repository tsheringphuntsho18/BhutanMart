import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../api/authAPI';
import ProductCard from '../components/ProductCard';
import { ArrowRight, Zap, ShoppingBag, Shield, Truck } from 'lucide-react';
import '../styles/pages/Home.css';

export default function Home() {
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingProducts();
  }, []);

  const fetchTrendingProducts = async () => {
    try {
      const response = await productAPI.getAllProducts({ limit: 8 });
      setTrendingProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Welcome to <span>BhutanMart</span>
          </h1>
          <p>Discover authentic Bhutanese products and exclusive deals — delivered to your door.</p>
          <div className="hero-buttons">
            <Link to="/products" className="btn btn-primary">
              Shop Now <ArrowRight size={18} />
            </Link>
            <Link to="/register" className="btn btn-outline">
              Join Free
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="features-inner">
          <h2>Why Choose BhutanMart?</h2>
          <p className="section-subtitle">Your trusted marketplace for authentic Bhutanese products</p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><ShoppingBag size={28} /></div>
              <h3>Wide Selection</h3>
              <p>Thousands of authentic Bhutanese products across all categories</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Truck size={28} /></div>
              <h3>Fast Delivery</h3>
              <p>Quick and reliable shipping across Bhutan and beyond</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Zap size={28} /></div>
              <h3>Best Prices</h3>
              <p>Competitive prices and regular flash deals updated in real-time</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Shield size={28} /></div>
              <h3>Secure Shopping</h3>
              <p>Your data and transactions are fully protected</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="trending">
        <div className="section-header">
          <div>
            <h2>Trending Products</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: 4 }}>
              Real-time bestsellers powered by Redis leaderboard
            </p>
          </div>
          <Link to="/products" className="btn btn-outline">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="loading"></div>
        ) : trendingProducts.length > 0 ? (
          <div className="products-grid">
            {trendingProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
            No products available yet.
          </p>
        )}
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Join Our Community</h2>
        <p>Sign up today and get access to exclusive deals and updates</p>
        <Link to="/register" className="btn btn-primary">
          Create Account <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}
