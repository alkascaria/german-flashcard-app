import PropTypes from 'prop-types';
import './FilterToolbar.css';

const FilterToolbar = ({
  selectedCategory,
  selectedDifficulty,
  searchTerm,
  categories,
  onCategoryChange,
  onDifficultyChange,
  onSearchChange
}) => {
  return (
    <div className="filter-toolbar">
      <select 
        value={selectedCategory} 
        onChange={onCategoryChange}
      >
        <option value="All">All Categories</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <select
        value={selectedDifficulty}
        onChange={onDifficultyChange}
      >
        <option value="All">All Difficulties</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      <input
        type="text"
        placeholder="Search cards..."
        value={searchTerm}
        onChange={onSearchChange}
      />
    </div>
  );
};

FilterToolbar.propTypes = {
  selectedCategory: PropTypes.string.isRequired,
  selectedDifficulty: PropTypes.string.isRequired,
  searchTerm: PropTypes.string.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  onDifficultyChange: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func.isRequired
};

export default FilterToolbar;