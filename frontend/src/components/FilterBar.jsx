import { Search, Filter } from 'lucide-react';
import '../styles/components/FilterBar.css';

export default function FilterBar({ filters, onFilterChange }) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({
      ...filters,
      [name]: name === 'search' ? value : parseFloat(value) || value,
    });
  };

  return (
    <div className="filter-bar">
      <div className="filter-header">
        <Filter size={20} />
        <h3>Filters</h3>
      </div>

      <div className="filter-group">
        <label>Search Products</label>
        <div className="search-input">
          <Search size={18} />
          <input
            type="text"
            name="search"
            placeholder="Search..."
            value={filters.search}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="filter-group">
        <label>Price Range</label>
        <div className="price-range">
          <input
            type="range"
            name="minPrice"
            min="0"
            max="10000"
            step="100"
            value={filters.minPrice}
            onChange={handleInputChange}
            className="slider"
          />
          <input
            type="range"
            name="maxPrice"
            min="0"
            max="10000"
            step="100"
            value={filters.maxPrice}
            onChange={handleInputChange}
            className="slider"
          />
          <div className="price-display">
            <span>Nu. {filters.minPrice}</span>
            <span>-</span>
            <span>Nu. {filters.maxPrice}</span>
          </div>
        </div>
      </div>

      <div className="filter-group">
        <label>Category</label>
        <select
          name="category"
          value={filters.category}
          onChange={handleInputChange}
          className="select-input"
        >
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="home">Home & Garden</option>
          <option value="books">Books</option>
          <option value="sports">Sports</option>
        </select>
      </div>
    </div>
  );
}
