import PropTypes from 'prop-types';
import { useState } from 'react';
import './QuizCard.css';

export const QuizCard = ({ card, onSubmit }) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(answer);
    setAnswer('');
  };

  return (
    <div className="quiz-card">
      <h3 className="german-text">{card.german}</h3>
      <form onSubmit={handleSubmit}>
        <div className="quiz-input-group">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type English translation..."
            autoFocus
          />
          <button type="submit" className="quiz-submit-btn">
            Check
          </button>
        </div>
      </form>
    </div>
  );
};

QuizCard.propTypes = {
  card: PropTypes.shape({
    german: PropTypes.string.isRequired,
    english: PropTypes.string.isRequired
  }).isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default QuizCard;