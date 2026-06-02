import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { productAPI } from '../api/authAPI';
import { useCartStore } from '../context/CartContext';
import toast from 'react-hot-toast';
import { Star, ShoppingCart, Minus, Plus } from 'lucide-react';
import '../styles/pages/ProductDetails.css';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCartStore();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productAPI.getProductById(id);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(product._id, quantity, product.price, product.name, product.imageUrl || '');
      toast.success('Product added to cart!');
      setQuantity(1);
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) return <div className="loading">Loading product...</div>;
  if (!product) return <div className="error">Product not found</div>;

  const rating = product.rating || 4.5;
  const reviews = product.reviews || 0;

  return (
    <div className="product-details">
      <div className="product-container">
        <div className="product-image">
          <img src={product.imageUrl || product.image || '/images/placeholder.png'} alt={product.name} />
        </div>

        <div className="product-info">
          <h1>{product.name}</h1>
          
          <div className="product-rating">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  fill={i < Math.floor(rating) ? '#fbbf24' : '#e5e7eb'}
                />
              ))}
            </div>
            <span className="rating-text">{rating} ({reviews} reviews)</span>
          </div>

          <div className="product-price">
            <h2 className="price">Nu. {product.price.toLocaleString()}</h2>
            {product.originalPrice && (
              <span className="original-price">Nu. {product.originalPrice.toLocaleString()}</span>
            )}
          </div>

          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          <div className="product-specs">
            <h3>Specifications</h3>
            <ul>
              {product.specifications?.map((spec, i) => (
                <li key={i}>{spec}</li>
              ))}
            </ul>
          </div>

          <div className="product-actions">
            <div className="quantity-selector">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus size={20} />
              </button>
              <input type="number" value={quantity} readOnly />
              <button onClick={() => setQuantity(quantity + 1)}>
                <Plus size={20} />
              </button>
            </div>

            <button className="btn btn-primary add-to-cart" onClick={handleAddToCart}>
              <ShoppingCart size={20} />
              Add to Cart
            </button>
          </div>

          <div className="product-meta">
            <p><strong>Seller:</strong> {product.seller?.storeName || 'BhutanMart'}</p>
            <p><strong>Stock:</strong> {product.stock > 0 ? 'In Stock' : 'Out of Stock'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
