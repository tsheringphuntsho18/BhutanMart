import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../context/CartContext';
import toast from 'react-hot-toast';
import '../styles/components/ProductCard.css';

export default function ProductCard({ product }) {
  const { addToCart } = useCartStore();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product._id, 1, product.price, product.name, product.imageUrl || '');
      toast.success('Added to cart!');
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const rating = product.rating || 4;

  return (
    <Link to={`/products/${product._id}`} className="product-card">
      <div className="product-image-wrapper">
        <img
          src={product.imageUrl || product.image || '/images/placeholder.png'}
          alt={product.name}
          className="product-image"
          onError={(e) => { e.target.src = '/images/placeholder.png'; }}
        />
        <button className="add-to-cart-btn" onClick={handleAddToCart} title="Add to Cart">
          <ShoppingCart size={18} />
        </button>
      </div>

      <div className="product-card-body">
        <h3 className="product-name">{product.name}</h3>

        <div className="product-rating">
          <div className="stars">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={13}
                fill={i < Math.floor(rating) ? '#fbbf24' : '#e5e7eb'}
                stroke={i < Math.floor(rating) ? '#fbbf24' : '#e5e7eb'}
              />
            ))}
          </div>
          <span>({product.reviews || 0})</span>
        </div>

        {product.description && (
          <p className="product-description">
            {product.description.substring(0, 70)}{product.description.length > 70 ? '...' : ''}
          </p>
        )}

        <div className="product-footer">
          <div className="product-price">
            <span className="price">Nu. {product.price?.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="original-price">Nu. {product.originalPrice.toLocaleString()}</span>
            )}
          </div>
          {product.stock > 0 ? (
            <span className="badge badge-success">In Stock</span>
          ) : (
            <span className="badge badge-error">Out of Stock</span>
          )}
        </div>
      </div>
    </Link>
  );
}
