import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { productAPI, reviewAPI, userAPI } from '../api/authAPI';
import { Eye } from 'lucide-react';
import { useCartStore } from '../context/CartContext';
import { useAuthStore } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Star, ShoppingCart, Minus, Plus, Heart } from 'lucide-react';
import '../styles/pages/ProductDetails.css';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [uniqueViews, setUniqueViews] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const { addToCart } = useCartStore();
  const { user, updateUser } = useAuthStore();

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    productAPI.getUniqueViews(id)
      .then(res => setUniqueViews(res.data.uniqueViews))
      .catch(() => {});
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productAPI.getProductById(id);
      const p = response.data.product || response.data;
      setProduct(p);
    } catch {
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await reviewAPI.getProductReviews(id);
      setReviews(res.data.reviews || res.data.data || []);
    } catch {
      setReviews([]);
    }
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(product._id, quantity, product.price, product.name, product.imageUrl || '');
      toast.success('Added to cart!');
      setQuantity(1);
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const handleWishlist = async () => {
    if (!user) { toast.error('Please login first'); return; }
    try {
      let res;
      if (wishlisted) {
        res = await userAPI.removeFromWishlist(product._id);
        toast.success('Removed from wishlist');
      } else {
        res = await userAPI.addToWishlist(product._id);
        toast.success('Added to wishlist');
      }
      // Sync the updated wishlist back into the auth store so Profile reflects it
      if (res.data.wishlist !== undefined) {
        updateUser({ ...user, wishlist: res.data.wishlist });
      }
      setWishlisted(!wishlisted);
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to review'); return; }
    setSubmittingReview(true);
    try {
      await reviewAPI.createReview({ productId: id, ...reviewForm });
      toast.success('Review submitted!');
      setReviewForm({ rating: 5, comment: '' });
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="loading">Loading product...</div>;
  if (!product) return <div className="error">Product not found</div>;

  const rating = product.rating || 0;
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : rating;

  return (
    <div className="product-details">
      <div className="product-container">
        <div className="product-image">
          <img
            src={product.imageUrl || '/images/placeholder.png'}
            alt={product.name}
            onError={e => { e.target.src = '/images/placeholder.png'; }}
          />
        </div>

        <div className="product-info">
          <h1>{product.name}</h1>

          <div className="product-rating">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20}
                  fill={i < Math.floor(avgRating) ? '#fbbf24' : '#e5e7eb'}
                  stroke={i < Math.floor(avgRating) ? '#fbbf24' : '#e5e7eb'}
                />
              ))}
            </div>
            <span className="rating-text">{avgRating.toFixed(1)} ({reviews.length} reviews)</span>
          </div>

          <div className="product-price">
            <h2 className="price">Nu. {product.price?.toLocaleString()}</h2>
          </div>

          {product.description && (
            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          <div className="product-meta">
            <p><strong>Category:</strong> {product.categoryId?.name || '—'}</p>
            <p><strong>Stock:</strong> {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}</p>
            {uniqueViews !== null && (
              <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye size={14} style={{ color: '#6b7280' }} />
                <strong>{uniqueViews}</strong> unique visitor{uniqueViews !== 1 ? 's' : ''}
              </p>
            )}
            {product.tags?.length > 0 && (
              <p><strong>Tags:</strong> {product.tags.join(', ')}</p>
            )}
          </div>

          {product.variants?.length > 0 && (
            <div className="product-variants">
              <h3>Variants</h3>
              <div className="variants-grid">
                {product.variants.map((v, i) => (
                  <span key={i} className="variant-chip">
                    {[v.size, v.color, v.sku].filter(Boolean).join(' · ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="product-actions">
            <div className="quantity-selector">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={18} /></button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}><Plus size={18} /></button>
            </div>
            <button
              className="btn btn-primary add-to-cart"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingCart size={18} /> Add to Cart
            </button>
            <button
              className={`btn-wishlist ${wishlisted ? 'active' : ''}`}
              onClick={handleWishlist}
              title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={20} fill={wishlisted ? '#ef4444' : 'none'} stroke={wishlisted ? '#ef4444' : 'currentColor'} />
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <h2>Customer Reviews ({reviews.length})</h2>

        {user && (
          <form className="review-form" onSubmit={handleReviewSubmit}>
            <h3>Write a Review</h3>
            <div className="review-rating-input">
              <label>Rating:</label>
              <div className="stars-input">
                {[1,2,3,4,5].map(n => (
                  <button type="button" key={n} onClick={() => setReviewForm(p => ({ ...p, rating: n }))}>
                    <Star size={22}
                      fill={n <= reviewForm.rating ? '#fbbf24' : '#e5e7eb'}
                      stroke={n <= reviewForm.rating ? '#fbbf24' : '#e5e7eb'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={reviewForm.comment}
              onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
              placeholder="Share your experience..."
              rows={3}
              required
              className="review-textarea"
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={submittingReview}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet. Be the first!</p>
        ) : (
          <div className="reviews-list">
            {reviews.map(r => (
              <div key={r._id} className="review-card">
                <div className="review-header">
                  <div className="reviewer-avatar">{r.userId?.name?.charAt(0) || 'U'}</div>
                  <div>
                    <strong>{r.userId?.name || 'User'}</strong>
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13}
                          fill={i < r.rating ? '#fbbf24' : '#e5e7eb'}
                          stroke={i < r.rating ? '#fbbf24' : '#e5e7eb'}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="review-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="review-comment">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
