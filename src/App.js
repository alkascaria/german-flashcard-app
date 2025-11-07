import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { flashcardApi } from './api/flashcardApi';
import './App.css';
import AddCardForm from './components/AddCardForm';
import Flashcard from './components/Flashcard';
import QuizCard from './components/QuizCard';

function App() {
  const [cardState, setCardState] = useState({
    flashcards: [],
    filteredCards: [],
    currentCardIndex: 0,
    categories: []
  });

  const [uiState, setUiState] = useState({
    showAnswer: false,
    showDetails: false,
    showAddCard: false,
    showGrid: false,
    showExportModal: false,
    showImportModal: false,
    editMode: false
  });

  const [studyState, setStudyState] = useState({
    mode: 'normal',
    quizScore: { correct: 0, incorrect: 0 },
    quizFeedback: null,
    spacedQueue: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({ api: null, db: null, ui: null });

  // New state for form inputs
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

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all flashcards
  const fetchFlashcards = async () => {
    try {
      setIsLoading(true);
      const cards = await flashcardApi.getFlashcards();
      setCardState(prev => ({ 
        ...prev, 
        flashcards: cards,
        filteredCards: cards,
        categories: [...new Set(cards.map(card => card.category))]
      }));
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
    // saveFlashcards(cardState.flashcards);
  }, [cardState.flashcards]);

  // Filter cards based on selected category, difficulty, and search term
  useEffect(() => {
    if (cardState.flashcards.length === 0) {
      setCardState(prev => ({ ...prev, filteredCards: [] }));
      return;
    }

    let filtered = [...cardState.flashcards];
    
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
    
    // Update studyMode reference
    if (studyState.mode === 'spaced') {
      filtered = sortCardsForSpacedRepetition(filtered);
    }
    
    setCardState(prev => ({ 
      ...prev, 
      filteredCards: filtered,
      currentCardIndex: 0
    }));
    setUiState(prev => ({ 
      ...prev, 
      showAnswer: false,
      showDetails: false
    }));
  }, [selectedCategory, selectedDifficulty, searchTerm, cardState.flashcards, studyState.mode]);

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
    setUiState(prev => ({ ...prev, showAnswer: !prev.showAnswer }));
  };

  // Function to toggle details
  const handleToggleDetails = () => {
    setUiState(prev => ({ ...prev, showDetails: !prev.showDetails }));
  };

  // Functions to navigate cards
  const handleNext = () => {
    if (cardState.filteredCards.length > 0) {
      // Update card review data in spaced repetition mode
      if (studyState.mode === 'spaced' && uiState.showAnswer) {
        updateCardReview();
      }
      
      setCardState(prev => ({ 
        ...prev, 
        currentCardIndex: (prev.currentCardIndex + 1) % prev.filteredCards.length 
      }));
      setUiState(prev => ({ 
        ...prev, 
        showAnswer: false,
        showDetails: false
      }));
    }
  };

  const handlePrevious = () => {
    if (cardState.filteredCards.length > 0) {
      setCardState(prev => ({ 
        ...prev, 
        currentCardIndex: (prev.currentCardIndex - 1 + prev.filteredCards.length) % prev.filteredCards.length 
      }));
      setUiState(prev => ({ 
        ...prev, 
        showAnswer: false,
        showDetails: false
      }));
    }
  };

  // Update card review info for spaced repetition
  const updateCardReview = () => {
    const currentCard = cardState.filteredCards[cardState.currentCardIndex];
    const updatedCards = cardState.flashcards.map(card => {
      if (card._id === currentCard._id) {
        return {
          ...card,
          lastReviewed: new Date().getTime(),
          timesReviewed: card.timesReviewed + 1
        };
      }
      return card;
    });
    
    setCardState(prev => ({ ...prev, flashcards: updatedCards }));
  };

  // Function to handle difficulty rating
  const handleRateDifficulty = async (cardId, difficulty) => {
    try {
      setIsLoading(true);
      const cardToUpdate = cardState.flashcards.find(card => card._id === cardId);
      const updatedCard = { ...cardToUpdate, difficulty };
      await flashcardApi.updateFlashcard(cardId, updatedCard);
      setCardState(current => 
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
    const currentCard = cardState.filteredCards[cardState.currentCardIndex];
    const isCorrect = answer.toLowerCase().trim() === currentCard.english.toLowerCase().trim();
    
    setStudyState(prev => ({
      ...prev,
      quizFeedback: {
        correct: isCorrect,
        message: isCorrect 
          ? 'Correct! 🎉' 
          : `Incorrect. The correct answer is: ${currentCard.english}`
      },
      quizScore: {
        correct: prev.quizScore.correct + (isCorrect ? 1 : 0),
        incorrect: prev.quizScore.incorrect + (isCorrect ? 0 : 1)
      }
    }));
    
    // Show feedback for 2 seconds before moving to next card
    setTimeout(() => {
      setStudyState(prev => ({ ...prev, quizFeedback: null }));
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

      setCardState(current => ({ 
        ...current, 
        flashcards: [addedCard, ...current.flashcards],
        filteredCards: [addedCard, ...current.filteredCards]
      }));
      setUiState(prev => ({ ...prev, showAddCard: false }));
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
      setError(handleApiError(error, 'add flashcard'));
    } finally {
      setIsLoading(false);
    }
  };

  const validateCard = (card) => {
    const errors = [];
    if (!card.german?.trim()) errors.push('German text is required');
    if (!card.english?.trim()) errors.push('English text is required');
    if (card.wordType === 'noun' && !card.gender) errors.push('Gender is required for nouns');
    return errors;
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
      
      setCardState(currentCards => 
        currentCards.filter(card => card._id !== id)
      );
      
      // Reset current card index if necessary
      if (cardState.currentCardIndex >= cardState.filteredCards.length - 1) {
        setCardState(prev => ({ 
          ...prev, 
          currentCardIndex: Math.max(0, prev.filteredCards.length - 2) 
        }));
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
    setUiState(prev => ({ ...prev, editMode: true, showAddCard: true }));
  };

  // Function to save edited card
  const handleSaveEdit = async () => {
    try {
      setIsLoading(true);
      const updatedCard = await flashcardApi.updateFlashcard(newCard._id, newCard);
      setCardState(current => 
        current.map(card => card._id === newCard._id ? updatedCard : card)
      );
      setUiState(prev => ({ ...prev, showAddCard: false, editMode: false }));
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
    setStudyState(prev => ({ 
      ...prev, 
      quizScore: { correct: 0, incorrect: 0 },
      quizFeedback: null
    }));
    setUiState(prev => ({ ...prev, showQuizInput: false }));
    setCardState(prev => ({ ...prev, currentCardIndex: 0 }));
  };

  // Refresh function
  const handleRefresh = () => {
    fetchFlashcards();
    resetQuiz();
    setCardState(prev => ({ ...prev, currentCardIndex: 0 }));
    setUiState(prev => ({ ...prev, showAnswer: false, showDetails: false }));
  };

  // Toggle grid view
  const toggleGridView = () => {
    setUiState(prev => ({ ...prev, showGrid: !prev.showGrid }));
  };

  // Add this useEffect for keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (uiState.showAddCard || isLoading) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === ' ') {
        e.preventDefault();
        handleFlip();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [cardState.currentCardIndex, cardState.filteredCards.length, uiState.showAddCard, isLoading]);

  // Add these handler functions
  const handleCardReview = async (cardId, remembered) => {
    try {
      setIsLoading(true);
      const cardToUpdate = cardState.flashcards.find(card => card._id === cardId);
      
      const updatedCard = {
        ...cardToUpdate,
        lastReviewed: new Date(),
        timesReviewed: cardToUpdate.timesReviewed + 1,
        nextReview: calculateNextReview(remembered ? cardToUpdate.timesReviewed + 1 : 0)
      };

      await flashcardApi.updateFlashcard(cardId, updatedCard);
      
      setCardState(current => 
        current.map(card => card._id === cardId ? updatedCard : card)
      );

      if (studyState.mode === 'spaced') {
        setStudyState(prev => ({ 
          ...prev, 
          spacedQueue: prev.spacedQueue.filter(id => id !== cardId) 
        }));
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
    if (studyState.mode === 'spaced' && cardState.flashcards.length > 0) {
      const now = new Date();
      const dueCards = cardState.flashcards
        .filter(card => {
          const nextReview = card.nextReview ? new Date(card.nextReview) : null;
          return !nextReview || nextReview <= now;
        })
        .map(card => card._id);
      
      setStudyState(prev => ({ ...prev, spacedQueue: dueCards }));
    }
  }, [studyState.mode, cardState.flashcards]);

  // Create a generic async handler
  const createAsyncHandler = (operation, successCallback) => async (...args) => {
    try {
      setIsLoading(true);
      const result = await operation(...args);
      successCallback(result);
      setError(null);
    } catch (error) {
      setError(handleApiError(error, operation.name));
    } finally {
      setIsLoading(false);
    }
  };

  // Update the return statement to include loading and error states
  return (
    <div className="app">
      <div className="controls-container">
        <div className="mode-selector">
          <button 
            className={`mode-btn ${studyState.mode === 'normal' ? 'active' : ''}`}
            onClick={() => setStudyState(prev => ({ ...prev, mode: 'normal' }))}
          >
            Normal
          </button>
          <button 
            className={`mode-btn ${studyState.mode === 'quiz' ? 'active' : ''}`}
            onClick={() => {
              setStudyState(prev => ({ 
                ...prev, 
                mode: 'quiz',
                quizScore: { correct: 0, incorrect: 0 },
                quizFeedback: null
              }));
            }}
          >
            Quiz
          </button>
          <button 
            className={`mode-btn ${studyState.mode === 'spaced' ? 'active' : ''}`}
            onClick={() => setStudyState(prev => ({ ...prev, mode: 'spaced' }))}
          >
            Spaced
          </button>
        </div>

        <button className="add-btn" onClick={() => setUiState(prev => ({ ...prev, showAddCard: true }))}>
          Add Card
        </button>
      </div>

      <div className="filter-toolbar">
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          {cardState.categories.map(cat => (
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
        {studyState.mode === 'quiz' ? (
          <div className="quiz-section">
            <div className="quiz-score">
              <span>Correct: {studyState.quizScore.correct}</span>
              <span>Incorrect: {studyState.quizScore.incorrect}</span>
            </div>
            
            {studyState.quizFeedback && (
              <div className={`quiz-feedback ${studyState.quizFeedback.correct ? 'correct' : 'incorrect'}`}>
                {studyState.quizFeedback.message}
              </div>
            )}

            <QuizCard
              card={cardState.filteredCards[cardState.currentCardIndex]}
              onSubmit={handleQuizAnswer}
            />
          </div>
        ) : studyState.mode === 'spaced' ? (
          studyState.spacedQueue.length === 0 ? (
            <div className="no-cards">No cards due for review! 🎉</div>
          ) : (
            <div className="spaced-review">
              <Flashcard
                {...cardState.filteredCards[cardState.currentCardIndex]}
                onDelete={handleDelete}
                onEdit={handleEditCard}
              />
              <div className="review-buttons">
                <button onClick={() => handleCardReview(cardState.filteredCards[cardState.currentCardIndex]._id, false)}>
                  Didn't Remember
                </button>
                <button onClick={() => handleCardReview(cardState.filteredCards[cardState.currentCardIndex]._id, true)}>
                  Remembered
                </button>
              </div>
            </div>
          )
        ) : (
          <div className={`normal-view ${uiState.showGrid ? 'grid' : 'single'}`}>
            {cardState.filteredCards.map(card => (
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

      {uiState.showAddCard && (
        <AddCardForm
          newCard={newCard}
          onSubmit={uiState.editMode ? handleSaveEdit : handleAddCard}
          onCancel={() => {
            setUiState(prev => ({ ...prev, showAddCard: false, editMode: false }));
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
          editMode={uiState.editMode}
        />
      )}

      {error && Object.values(error).some(e => e) && (
        <div className="error-container">
          {error.api && <div className="error-message api-error">{error.api}</div>}
          {error.db && <div className="error-message db-error">{error.db}</div>}
          {error.ui && <div className="error-message ui-error">{error.ui}</div>}
        </div>
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
}

// Add this utility function
const handleApiError = (error, operation) => {
  console.error(`Failed to ${operation}:`, error);
  return {
    api: `Failed to ${operation}: ${error.message}`,
    db: null,
    ui: null
  };
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

export default App;