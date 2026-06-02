import { useEffect, useState } from 'react';
import { productAPI } from '../api/authAPI';
import ProductCard from '../components/ProductCard';
import FilterBar from '../components/FilterBar';
import '../styles/pages/Products.css';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    minPrice: 0,
    maxPrice: 10000,
    category: '',
  });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        search: filters.search || undefined,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        categoryId: filters.category || undefined,
      };
      const response = await productAPI.getAllProducts(params);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="products-page">
      <div className="products-header">
        <h1>Our Products</h1>
        <p>Browse our collection of authentic Bhutanese items</p>
      </div>

      <div className="products-container">
        <FilterBar filters={filters} onFilterChange={setFilters} />
        
        <div className="products-content">
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <p>No products found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
