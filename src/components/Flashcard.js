import PropTypes from 'prop-types';
import { useState } from 'react';
import './Flashcard.css';

const Flashcard = ({
  _id,
  german,
  english,
  category,
  difficulty,
  examples,
  wordType,
  gender,
  onDelete,
  onEdit
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this card?')) {
      onDelete(_id);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit({
      _id,
      german,
      english,
      category,
      difficulty,
      examples,
      wordType,
      gender
    });
  };

  return (
    <div 
      className={`flashcard ${isFlipped ? 'flipped' : ''}`} 
      onClick={handleFlip}
    >
      <div className="flashcard-inner">
        <div className="flashcard-front">
          <div className="card-content">
            {wordType === 'noun' && gender && (
              <span className="gender-indicator">
                {gender === 'masculine' ? 'der' : gender === 'feminine' ? 'die' : 'das'}
              </span>
            )}
            <h2 className="german-text">{german}</h2>
            {category && <span className="category-tag">{category}</span>}
          </div>
          <div className="card-actions">
            <button 
              className="edit-btn"
              onClick={handleEdit}
              title="Edit"
            >
              ✎
            </button>
            <button 
              className="delete-btn"
              onClick={handleDelete}
              title="Delete"
            >
              ×
            </button>
          </div>
        </div>
        <div className="flashcard-back">
          <div className="card-content">
            <h3 className="english-text">{english}</h3>
            {examples && (
              <p className="examples">{examples}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

Flashcard.propTypes = {
  _id: PropTypes.string.isRequired,
  german: PropTypes.string.isRequired,
  english: PropTypes.string.isRequired,
  category: PropTypes.string,
  difficulty: PropTypes.string,
  examples: PropTypes.string,
  wordType: PropTypes.string,
  gender: PropTypes.string,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
};

export default Flashcard;