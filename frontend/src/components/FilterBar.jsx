import { useEffect, useState } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { categoryAPI } from '../api/authAPI';
import '../styles/components/FilterBar.css';

export default function FilterBar({ filters, onFilterChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoryAPI.getAllCategories()
      .then(res => setCategories(res.data?.data || []))
      .catch(() => setCategories([]));
  }, []);

  const set = (key, value) => onFilterChange({ ...filters, [key]: value });

  // Group into parent → children for hierarchical display
  const parents = categories.filter(c => !c.parentCategory);
  const children = categories.filter(c => c.parentCategory);

  return (
    <div className="filter-bar">
      <div className="filter-header">
        <Filter size={20} />
        <h3>Filters</h3>
      </div>

      {/* Search */}
      <div className="filter-group">
        <label>Search Products</label>
        <div className="search-input">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, description, tags..."
            value={filters.search}
            onChange={e => set('search', e.target.value)}
          />
        </div>
      </div>

      {/* Category */}
      <div className="filter-group">
        <label>Category</label>
        <select
          value={filters.categoryId || ''}
          onChange={e => set('categoryId', e.target.value)}
          className="select-input"
        >
          <option value="">All Categories</option>
          {parents.map(p => (
            <optgroup key={p._id} label={p.name}>
              <option value={p._id}>{p.name} (all)</option>
              {children
                .filter(c => c.parentCategory === p._id || c.parentCategory?._id === p._id)
                .map(c => (
                  <option key={c._id} value={c._id}>— {c.name}</option>
                ))}
            </optgroup>
          ))}
          {/* Categories with no parent that weren't in parents list already */}
          {categories.filter(c => !c.parentCategory && !parents.find(p => p._id === c._id)).map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="filter-group">
        <label>Price Range</label>
        <div className="price-inputs">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={e => set('minPrice', e.target.value ? parseFloat(e.target.value) : '')}
            className="price-input"
            min="0"
          />
          <span>—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={e => set('maxPrice', e.target.value ? parseFloat(e.target.value) : '')}
            className="price-input"
            min="0"
          />
        </div>
      </div>

      {/* Sort */}
      <div className="filter-group">
        <label><SlidersHorizontal size={14} /> Sort By</label>
        <select
          value={filters.sortBy || ''}
          onChange={e => set('sortBy', e.target.value)}
          className="select-input"
        >
          <option value="">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {/* Reset */}
      <button
        className="btn btn-outline btn-sm reset-btn"
        onClick={() => onFilterChange({ search: '', categoryId: '', minPrice: '', maxPrice: '', sortBy: '' })}
      >
        Reset Filters
      </button>
    </div>
  );
}
