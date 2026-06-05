import { useEffect, useState } from 'react';
import { productAPI } from '../api/authAPI';
import ProductCard from '../components/ProductCard';
import FilterBar from '../components/FilterBar';
import '../styles/pages/Products.css';

const PAGE_SIZE = 12;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '', categoryId: '', minPrice: '', maxPrice: '', sortBy: '',
  });

  // Reset to page 1 whenever filters change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  useEffect(() => {
    fetchProducts();
  }, [filters, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        ...(filters.search    && { search:     filters.search }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.minPrice !== '' && { minPrice: filters.minPrice }),
        ...(filters.maxPrice !== '' && { maxPrice: filters.maxPrice }),
        ...(filters.sortBy    && { sortBy:      filters.sortBy }),
      };
      const response = await productAPI.getAllProducts(params);
      setProducts(response.data.data || []);
      setPagination(response.data.pagination || { currentPage: 1, totalPages: 1, totalCount: 0 });
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
        <FilterBar filters={filters} onFilterChange={handleFilterChange} />

        <div className="products-content">
          {/* Result count */}
          {!loading && (
            <div className="results-bar">
              <span>{pagination.totalCount} product{pagination.totalCount !== 1 ? 's' : ''} found</span>
            </div>
          )}

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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
              >
                ← Prev
              </button>

              <div className="page-numbers">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(n => n === 1 || n === pagination.totalPages || Math.abs(n - page) <= 1)
                  .reduce((acc, n, i, arr) => {
                    if (i > 0 && n - arr[i - 1] > 1) acc.push('...');
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((n, i) =>
                    n === '...' ? (
                      <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
                    ) : (
                      <button
                        key={n}
                        className={`page-btn ${n === page ? 'active' : ''}`}
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </button>
                    )
                  )}
              </div>

              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page === pagination.totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
