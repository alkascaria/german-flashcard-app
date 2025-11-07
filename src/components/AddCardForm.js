import PropTypes from 'prop-types';
import './AddCardForm.css';

export const AddCardForm = ({ newCard, onSubmit, onCancel, onChange, editMode }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newCard.german?.trim() || !newCard.english?.trim()) {
      alert('German and English texts are required');
      return;
    }
    
    onSubmit(newCard);
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{editMode ? 'Edit Card' : 'Add New Card'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="german">German Text*</label>
            <input
              id="german"
              name="german"
              value={newCard.german}
              onChange={onChange}
              placeholder="Enter German text"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="english">English Text*</label>
            <input
              id="english"
              name="english"
              value={newCard.english}
              onChange={onChange}
              placeholder="Enter English text"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
              id="category"
              name="category"
              value={newCard.category}
              onChange={onChange}
              placeholder="Enter category"
            />
          </div>

          <div className="form-group">
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
              name="difficulty"
              value={newCard.difficulty}
              onChange={onChange}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="examples">Examples</label>
            <textarea
              id="examples"
              name="examples"
              value={newCard.examples}
              onChange={onChange}
              placeholder="Enter example sentences"
            />
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn btn-save">
              {editMode ? 'Save Changes' : 'Add Card'}
            </button>
            <button 
              type="button" 
              className="btn btn-cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

AddCardForm.propTypes = {
  newCard: PropTypes.shape({
    german: PropTypes.string.isRequired,
    english: PropTypes.string.isRequired,
    category: PropTypes.string,
    difficulty: PropTypes.string,
    examples: PropTypes.string,
    wordType: PropTypes.string,
    gender: PropTypes.string
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  editMode: PropTypes.bool.isRequired
};

export default AddCardForm;