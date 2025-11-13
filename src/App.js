import { useEffect, useMemo } from 'react';
import './App.css';
import AddCardForm from './components/AddCardForm';
import FilterToolbar from './components/FilterToolbar';
import Flashcard from './components/Flashcard';
import LoadingOverlay from './components/LoadingOverlay';
import QuizCard from './components/QuizCard';
import { useCardManagement } from './hooks/useCardManagement';

const STUDY_MODES = {
  NORMAL: 'normal',
  QUIZ: 'quiz',
  SPACED: 'spaced'
};

const INITIAL_CARD_STATE = {
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
};

function App() {
  const {
    cardState,
    uiState,          // Add this
    studyState,       // Add this
    newCard,          // Add this
    isLoading,
    error,
    selectedCategory,
    setSelectedCategory,
    selectedDifficulty,
    setSelectedDifficulty,
    searchTerm,
    setSearchTerm,
    handleCardReview,
    handleFlip,
    handleToggleDetails,
    handleNext,
    handlePrevious,
    updateCardReview,
    handleRateDifficulty,
    handleQuizAnswer,
    handleAddCard,
    handleInputChange,
    handleDelete,
    handleEditCard,
    handleSaveEdit,
    resetQuiz,
    handleRefresh,
    toggleGridView,
    setError,
    setIsLoading,
    setStudyState,
    setUiState,
    setNewCard,
    fetchFlashcards,  // Add this
    sortCardsForSpacedRepetition, // Add this
  } = useCardManagement();

  // Load flashcards on component mount
  useEffect(() => {
    fetchFlashcards();
    return () => {
      setError({ api: null, db: null, ui: null });
      setIsLoading(false);
    };
  }, []);

  // Save flashcards to localStorage whenever they change
  useEffect(() => {
    // saveFlashcards(cardState.flashcards);
  }, [cardState.flashcards]);

  // Filter cards based on selected category, difficulty, and search term
  const filteredCards = useMemo(() => {
    let filtered = [...cardState.flashcards];
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(card => card.category === selectedCategory);
    }
    
    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(card => card.difficulty === selectedDifficulty);
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(card => 
        card.german.toLowerCase().includes(term) || 
        card.english.toLowerCase().includes(term)
      );
    }
    
    return studyState.mode === 'spaced' ? sortCardsForSpacedRepetition(filtered) : filtered;
  }, [cardState.flashcards, selectedCategory, selectedDifficulty, searchTerm, studyState.mode, sortCardsForSpacedRepetition]);

  // Add error handling for async operations

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

      <FilterToolbar
        selectedCategory={selectedCategory}
        selectedDifficulty={selectedDifficulty}
        searchTerm={searchTerm}
        categories={cardState.categories}
        onCategoryChange={(e) => setSelectedCategory(e.target.value)}
        onDifficultyChange={(e) => setSelectedDifficulty(e.target.value)}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
      />

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
            setNewCard(INITIAL_CARD_STATE);
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

      <LoadingOverlay isVisible={isLoading} />
    </div>
  );
}

export default App;