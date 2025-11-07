// App.js - Updated with gender support
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { flashcardApi } from './api/flashcardApi';
import './App.css';
import Flashcard from './components/Flashcard';

const AddCardForm = ({ newCard, onSubmit, onCancel, onChange, editMode }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newCard.german?.trim() || !newCard.english?.trim()) {
      alert('German and English texts are required');
      return;
    }
    
    // Pass the card data to onSubmit
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

// Add QuizCard component
const QuizCard = ({ card, onSubmit }) => {
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

function App() {
  // State variables
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState({ api: null, db: null, ui: null });
  const [newCard, setNewCard] = useState({ 
    german: '', 
    english: '', 
    category: 'Uncategorized',
    difficulty: 'medium',
    examples: '',
    notes: '',
    lastReviewed: null,
    timesReviewed: 0,
    wordType: 'phrase',
    gender: null
  });
  const [showAddCard, setShowAddCard] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [studyMode, setStudyMode] = useState('normal'); // 'normal' or 'spaced'
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [quizScore, setQuizScore] = useState({ correct: 0, incorrect: 0 });
  const [showExportModal, setShowExportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [filteredCards, setFilteredCards] = useState([]);
  const [showGrid, setShowGrid] = useState(false); // New state for grid view
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [showQuizInput, setShowQuizInput] = useState(false);
  const [lastReviewedCards, setLastReviewedCards] = useState([]);
  const [spacedQueue, setSpacedQueue] = useState([]);

  // Fetch all flashcards
  const fetchFlashcards = async () => {
    try {
      setIsLoading(true);
      const cards = await flashcardApi.getFlashcards();
      setFlashcards(cards);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(cards.map(card => card.category))];
      setCategories(uniqueCategories);
      setError(prev => ({ ...prev, api: null }));
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      setError(prev => ({ ...prev, api: 'Failed to load flashcards' }));
    } finally {
      setIsLoading(false);
    }
  };

  // Load flashcards on component mount
  useEffect(() => {
    fetchFlashcards();
    return () => {
      setError({ api: null, db: null, ui: null });
      setIsLoading(false);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Save flashcards to localStorage whenever they change
  useEffect(() => {
    // saveFlashcards(flashcards);
  }, [flashcards]);

  // Filter cards based on selected category, difficulty, and search term
  useEffect(() => {
    if (flashcards.length === 0) {
      setFilteredCards([]);
      return;
    }

    let filtered = [...flashcards];
    
    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(card => card.category === selectedCategory);
    }
    
    // Filter by difficulty
    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(card => card.difficulty === selectedDifficulty);
    }
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        card => 
          card.german.toLowerCase().includes(term) || 
          card.english.toLowerCase().includes(term) ||
          card.examples.toLowerCase().includes(term) ||
          card.notes.toLowerCase().includes(term)
      );
    }
    
    // Apply study mode filters
    if (studyMode === 'spaced') {
      // Sort for spaced repetition mode
      filtered = sortCardsForSpacedRepetition(filtered);
    }
    
    setFilteredCards(filtered);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setShowDetails(false);
  }, [selectedCategory, selectedDifficulty, searchTerm, flashcards, studyMode]);

  // Function to sort cards for spaced repetition
  const sortCardsForSpacedRepetition = (cards) => {
    const now = new Date().getTime();
    const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);
    
    return [...cards].sort((a, b) => {
      // First, prioritize cards never reviewed
      if (!a.lastReviewed && b.lastReviewed) return -1;
      if (a.lastReviewed && !b.lastReviewed) return 1;
      
      // Then, prioritize hard cards
      if (a.difficulty === 'hard' && b.difficulty !== 'hard') return -1;
      if (a.difficulty !== 'hard' && b.difficulty === 'hard') return 1;
      
      // Finally, prioritize cards not reviewed recently
      if (a.lastReviewed && b.lastReviewed) {
        if (a.lastReviewed < twoDaysAgo && b.lastReviewed >= twoDaysAgo) return -1;
        if (a.lastReviewed >= twoDaysAgo && b.lastReviewed < twoDaysAgo) return 1;
      }
      
      return 0;
    });
  };

  // Function to flip the card
  const handleFlip = () => {
    setShowAnswer(!showAnswer);
  };

  // Function to toggle details
  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
  };

  // Functions to navigate cards
  const handleNext = () => {
    if (filteredCards.length > 0) {
      // Update card review data in spaced repetition mode
      if (studyMode === 'spaced' && showAnswer) {
        updateCardReview();
      }
      
      setCurrentCardIndex((currentCardIndex + 1) % filteredCards.length);
      setShowAnswer(false);
      setShowDetails(false);
    }
  };

  const handlePrevious = () => {
    if (filteredCards.length > 0) {
      setCurrentCardIndex((currentCardIndex - 1 + filteredCards.length) % filteredCards.length);
      setShowAnswer(false);
      setShowDetails(false);
    }
  };

  // Update card review info for spaced repetition
  const updateCardReview = () => {
    const currentCard = filteredCards[currentCardIndex];
    const updatedCards = flashcards.map(card => {
      if (card._id === currentCard._id) {
        return {
          ...card,
          lastReviewed: new Date().getTime(),
          timesReviewed: card.timesReviewed + 1
        };
      }
      return card;
    });
    
    setFlashcards(updatedCards);
  };

  // Function to handle difficulty rating
  const handleRateDifficulty = async (cardId, difficulty) => {
    try {
      setIsLoading(true);
      const cardToUpdate = flashcards.find(card => card._id === cardId);
      const updatedCard = { ...cardToUpdate, difficulty };
      await flashcardApi.updateFlashcard(cardId, updatedCard);
      setFlashcards(current => 
        current.map(card => card._id === cardId ? updatedCard : card)
      );
    } catch (error) {
      console.error('Failed to update difficulty:', error);
      setError(prev => ({ ...prev, api: 'Failed to update card difficulty' }));
    } finally {
      setIsLoading(false);
    }
  };

  // Quiz mode functions
  const handleQuizAnswer = (answer) => {
    const currentCard = filteredCards[currentCardIndex];
    const isCorrect = answer.toLowerCase().trim() === currentCard.english.toLowerCase().trim();
    
    setQuizFeedback({
      correct: isCorrect,
      message: isCorrect 
        ? 'Correct! 🎉' 
        : `Incorrect. The correct answer is: ${currentCard.english}`
    });
    
    // Update score
    setQuizScore(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));
    
    // Show feedback for 2 seconds before moving to next card
    setTimeout(() => {
      setQuizFeedback(null);
      handleNext();
    }, 2000);
  };

  // Add error handling for async operations

  // Function to add a new flashcard
  const handleAddCard = async () => {
    try {
      setIsLoading(true);
      console.log('Sending card data:', newCard);

      const cardToAdd = {
        german: newCard.german.trim(),
        english: newCard.english.trim(),
        category: newCard.category || 'Uncategorized',
        difficulty: newCard.difficulty || 'medium',
        examples: newCard.examples || '',
        notes: newCard.notes || '',
        wordType: newCard.wordType || 'phrase',
        gender: newCard.gender || null
      };

      const response = await fetch('http://localhost:5000/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardToAdd)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add card');
      }

      const addedCard = await response.json();
      console.log('Card added successfully:', addedCard);

      setFlashcards(current => [addedCard, ...current]);
      setShowAddCard(false);
      setNewCard({
        german: '',
        english: '',
        category: 'Uncategorized',
        difficulty: 'medium',
        examples: '',
        notes: '',
        lastReviewed: null,
        timesReviewed: 0,
        wordType: 'phrase',
        gender: null
      });
      setError({ api: null, db: null, ui: null }); // Update to set full error object
    } catch (error) {
      console.error('Error adding card:', error);
      setError({ 
        api: `Failed to add flashcard: ${error.message}`,
        db: null,
        ui: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle changes in the add card form inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If word type changes from noun, reset gender
    if (name === 'wordType' && value !== 'noun' && newCard.gender) {
      setNewCard({ 
        ...newCard, 
        [name]: value,
        gender: null 
      });
    } else {
      setNewCard({ ...newCard, [name]: value });
    }
  };

  // Function to delete the current card
  const handleDelete = async (id) => {
    try {
      setIsLoading(true);
      await flashcardApi.deleteFlashcard(id);
      
      setFlashcards(currentCards => 
        currentCards.filter(card => card._id !== id)
      );
      
      // Reset current card index if necessary
      if (currentCardIndex >= filteredCards.length - 1) {
        setCurrentCardIndex(Math.max(0, filteredCards.length - 2));
      }
      
      setError(prev => ({ ...prev, api: null }));
    } catch (error) {
      console.error('Failed to delete card:', error);
      setError(prev => ({ ...prev, api: 'Failed to delete flashcard' }));
    } finally {
      setIsLoading(false);
    }
  };

  // Function to edit the current card
  const handleEditCard = (card) => {
    setNewCard(card);
    setEditMode(true);
    setShowAddCard(true);
  };

  // Function to save edited card
  const handleSaveEdit = async () => {
    try {
      setIsLoading(true);
      const updatedCard = await flashcardApi.updateFlashcard(newCard._id, newCard);
      setFlashcards(current => 
        current.map(card => card._id === newCard._id ? updatedCard : card)
      );
      setShowAddCard(false);
      setEditMode(false);
      setError(null);
    } catch (error) {
      console.error('Failed to update card:', error);
      setError(prev => ({ ...prev, api: 'Failed to update flashcard' }));
    } finally {
      setIsLoading(false);
    }
  };

  // Reset quiz score
  const resetQuiz = () => {
    setQuizScore({ correct: 0, incorrect: 0 });
    setQuizFeedback(null);
    setShowQuizInput(false);
    setCurrentCardIndex(0);
  };

  // Refresh function
  const handleRefresh = () => {
    fetchFlashcards();
    resetQuiz();
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setShowDetails(false);
  };

  // Toggle grid view
  const toggleGridView = () => {
    setShowGrid(!showGrid);
  };

  // Add this useEffect for keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === ' ') {
        e.preventDefault();
        handleFlip();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentCardIndex, filteredCards.length]); // Updated dependencies

  // Add these handler functions
  const handleCardReview = async (cardId, remembered) => {
    try {
      setIsLoading(true);
      const cardToUpdate = flashcards.find(card => card._id === cardId);
      
      const updatedCard = {
        ...cardToUpdate,
        lastReviewed: new Date(),
        timesReviewed: cardToUpdate.timesReviewed + 1,
        nextReview: calculateNextReview(remembered ? cardToUpdate.timesReviewed + 1 : 0)
      };

      await flashcardApi.updateFlashcard(cardId, updatedCard);
      
      setFlashcards(current => 
        current.map(card => card._id === cardId ? updatedCard : card)
      );

      if (studyMode === 'spaced') {
        setSpacedQueue(current => current.filter(id => id !== cardId));
      }

      handleNext();
    } catch (error) {
      console.error('Failed to update card review:', error);
      setError(prev => ({ ...prev, api: 'Failed to update card review status' }));
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNextReview = (timesReviewed) => {
    const now = new Date();
    const days = Math.pow(2, timesReviewed); // Exponential spacing
    now.setDate(now.getDate() + days);
    return now;
  };

  // Add this useEffect for spaced repetition
  useEffect(() => {
    if (studyMode === 'spaced' && flashcards.length > 0) {
      const now = new Date();
      const dueCards = flashcards
        .filter(card => {
          const nextReview = card.nextReview ? new Date(card.nextReview) : null;
          return !nextReview || nextReview <= now;
        })
        .map(card => card._id);
      
      setSpacedQueue(dueCards);
    }
  }, [studyMode, flashcards]);

  // Update the return statement to include loading and error states
  return (
    <div className="app">
      <div className="controls-container">
        <div className="mode-selector">
          <button 
            className={`mode-btn ${studyMode === 'normal' ? 'active' : ''}`}
            onClick={() => setStudyMode('normal')}
          >
            Normal
          </button>
          <button 
            className={`mode-btn ${studyMode === 'quiz' ? 'active' : ''}`}
            onClick={() => {
              setStudyMode('quiz');
              resetQuiz();
            }}
          >
            Quiz
          </button>
          <button 
            className={`mode-btn ${studyMode === 'spaced' ? 'active' : ''}`}
            onClick={() => setStudyMode('spaced')}
          >
            Spaced
          </button>
        </div>

        <button className="add-btn" onClick={() => setShowAddCard(true)}>
          Add Card
        </button>
      </div>

      <div className="filter-toolbar">
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
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
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flashcards-container">
        {studyMode === 'quiz' ? (
          <div className="quiz-section">
            <div className="quiz-score">
              <span>Correct: {quizScore.correct}</span>
              <span>Incorrect: {quizScore.incorrect}</span>
            </div>
            
            {quizFeedback && (
              <div className={`quiz-feedback ${quizFeedback.correct ? 'correct' : 'incorrect'}`}>
                {quizFeedback.message}
              </div>
            )}

            <QuizCard
              card={filteredCards[currentCardIndex]}
              onSubmit={handleQuizAnswer}
            />
          </div>
        ) : studyMode === 'spaced' ? (
          spacedQueue.length === 0 ? (
            <div className="no-cards">No cards due for review! 🎉</div>
          ) : (
            <div className="spaced-review">
              <Flashcard
                {...filteredCards[currentCardIndex]}
                onDelete={handleDelete}
                onEdit={handleEditCard}
              />
              <div className="review-buttons">
                <button onClick={() => handleCardReview(filteredCards[currentCardIndex]._id, false)}>
                  Didn't Remember
                </button>
                <button onClick={() => handleCardReview(filteredCards[currentCardIndex]._id, true)}>
                  Remembered
                </button>
              </div>
            </div>
          )
        ) : (
          <div className={`normal-view ${showGrid ? 'grid' : 'single'}`}>
            {filteredCards.map(card => (
              <Flashcard
                key={card._id}
                {...card}
                onDelete={handleDelete}
                onEdit={handleEditCard}
              />
            ))}
          </div>
        )}
      </div>

      {showAddCard && (
        <AddCardForm
          newCard={newCard}
          onSubmit={editMode ? handleSaveEdit : handleAddCard}
          onCancel={() => {
            setShowAddCard(false);
            setEditMode(false);
            setNewCard({
              german: '',
              english: '',
              category: 'Uncategorized',
              difficulty: 'medium',
              examples: '',
              notes: '',
              lastReviewed: null,
              timesReviewed: 0,
              wordType: 'phrase',
              gender: null
            });
          }}
          onChange={handleInputChange}
          editMode={editMode}
        />
      )}

      {error && Object.values(error).some(e => e) && (
        <div className="error-container">
          {error.api && <div className="error-message api-error">{error.api}</div>}
          {error.db && <div className="error-message db-error">{error.db}</div>}
          {error.ui && <div className="error-message ui-error">{error.ui}</div>}
        </div>
      )}
    </div>
  );
}

App.propTypes = {
  initialFlashcards: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      german: PropTypes.string.isRequired,
      english: PropTypes.string.isRequired,
      category: PropTypes.string,
      difficulty: PropTypes.oneOf(['easy', 'medium', 'hard']),
      examples: PropTypes.string,
      notes: PropTypes.string,
      lastReviewed: PropTypes.number, // Changed from Date
      timesReviewed: PropTypes.number,
      wordType: PropTypes.oneOf(['noun', 'verb', 'adjective', 'phrase']),
      gender: PropTypes.oneOf(['der', 'die', 'das', null])
    })
  ),
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onUpdate: PropTypes.func
};

export default App;