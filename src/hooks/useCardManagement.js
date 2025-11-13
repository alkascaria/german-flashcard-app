import { useState } from 'react';
import { flashcardApi } from '../api/flashcardApi';
import { INITIAL_CARD_STATE, STUDY_MODES } from '../constants';

export const useCardManagement = () => {
  // Helper functions first
  const sortCardsForSpacedRepetition = (cards) => {
    const now = new Date().getTime();
    const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);
    
    return [...cards].sort((a, b) => {
      if (!a.lastReviewed && b.lastReviewed) return -1;
      if (a.lastReviewed && !b.lastReviewed) return 1;
      if (a.difficulty === 'hard' && b.difficulty !== 'hard') return -1;
      if (a.difficulty !== 'hard' && b.difficulty === 'hard') return 1;
      if (a.lastReviewed && b.lastReviewed) {
        if (a.lastReviewed < twoDaysAgo && b.lastReviewed >= twoDaysAgo) return -1;
        if (a.lastReviewed >= twoDaysAgo && b.lastReviewed < twoDaysAgo) return 1;
      }
      return 0;
    });
  };

  const calculateNextReview = (timesReviewed) => {
    const now = new Date();
    const days = Math.pow(2, timesReviewed);
    now.setDate(now.getDate() + days);
    return now;
  };

  // State declarations
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
    editMode: false
  });
  const [studyState, setStudyState] = useState({
    mode: STUDY_MODES.NORMAL,
    quizScore: { correct: 0, incorrect: 0 },
    quizFeedback: null,
    spacedQueue: []
  });
  const [newCard, setNewCard] = useState(INITIAL_CARD_STATE);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({ api: null, db: null, ui: null });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

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
    } catch (error) {
      setError(prev => ({ ...prev, api: 'Failed to load flashcards' }));
    } finally {
      setIsLoading(false);
    }
  };

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
      
      setCardState(prev => ({
        ...prev,
        flashcards: prev.flashcards.map(card => 
          card._id === cardId ? updatedCard : card
        )
      }));

    } catch (error) {
      setError(prev => ({ ...prev, api: 'Failed to update card review status' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlip = () => {
    setUiState(prev => ({ ...prev, showAnswer: !prev.showAnswer }));
  };

  const handleToggleDetails = () => {
    setUiState(prev => ({ ...prev, showDetails: !prev.showDetails }));
  };

  const handleNext = () => {
    setCardState(prev => ({
      ...prev,
      currentCardIndex: (prev.currentCardIndex + 1) % prev.filteredCards.length
    }));
    setUiState(prev => ({ ...prev, showAnswer: false }));
  };

  const handlePrevious = () => {
    setCardState(prev => ({
      ...prev,
      currentCardIndex: prev.currentCardIndex === 0 
        ? prev.filteredCards.length - 1 
        : prev.currentCardIndex - 1
    }));
    setUiState(prev => ({ ...prev, showAnswer: false }));
  };

  const updateCardReview = async (cardId, review) => {
    try {
      setIsLoading(true);
      const updatedCard = await flashcardApi.updateCardReview(cardId, review);
      setCardState(prev => ({
        ...prev,
        flashcards: prev.flashcards.map(card => 
          card._id === cardId ? updatedCard : card
        )
      }));
    } catch (error) {
      setError(prev => ({ ...prev, api: 'Failed to update card review' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateDifficulty = async (cardId, difficulty) => {
    try {
      setIsLoading(true);
      const updatedCard = await flashcardApi.updateCardDifficulty(cardId, difficulty);
      setCardState(prev => ({
        ...prev,
        flashcards: prev.flashcards.map(card => 
          card._id === cardId ? updatedCard : card
        )
      }));
    } catch (error) {
      setError(prev => ({ ...prev, api: 'Failed to update difficulty' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizAnswer = async (answer) => {
    const currentCard = cardState.filteredCards[cardState.currentCardIndex];
    const isCorrect = answer.toLowerCase().trim() === currentCard.english.toLowerCase().trim();
    
    setStudyState(prev => ({
      ...prev,
      quizScore: {
        correct: prev.quizScore.correct + (isCorrect ? 1 : 0),
        incorrect: prev.quizScore.incorrect + (isCorrect ? 0 : 1)
      },
      quizFeedback: {
        correct: isCorrect,
        message: isCorrect ? 'Correct!' : `Incorrect. The answer was: ${currentCard.english}`
      }
    }));

    setTimeout(() => {
      setStudyState(prev => ({ ...prev, quizFeedback: null }));
      handleNext();
    }, 2000);
  };

  const handleAddCard = async (card) => {
    try {
      setIsLoading(true);
      const newCard = await flashcardApi.createFlashcard(card);
      setCardState(prev => ({
        ...prev,
        flashcards: [...prev.flashcards, newCard],
        categories: [...new Set([...prev.categories, card.category])]
      }));
      setUiState(prev => ({ ...prev, showAddCard: false }));
    } catch (error) {
      setError(prev => ({ ...prev, api: 'Failed to add card' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCard(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = async (cardId) => {
    try {
      setIsLoading(true);
      await flashcardApi.deleteFlashcard(cardId);
      setCardState(prev => ({
        ...prev,
        flashcards: prev.flashcards.filter(card => card._id !== cardId)
      }));
    } catch (error) {
      setError(prev => ({ ...prev, api: 'Failed to delete card' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCard = (card) => {
    setNewCard(card);
    setUiState(prev => ({ 
      ...prev, 
      showAddCard: true,
      editMode: true 
    }));
  };

  const handleSaveEdit = async (card) => {
    try {
      setIsLoading(true);
      const updatedCard = await flashcardApi.updateFlashcard(card._id, card);
      setCardState(prev => ({
        ...prev,
        flashcards: prev.flashcards.map(c => 
          c._id === card._id ? updatedCard : c
        )
      }));
      setUiState(prev => ({ 
        ...prev, 
        showAddCard: false,
        editMode: false 
      }));
    } catch (error) {
      setError(prev => ({ ...prev, api: 'Failed to update card' }));
    } finally {
      setIsLoading(false);
    }
  };

  const resetQuiz = () => {
    setStudyState(prev => ({
      ...prev,
      quizScore: { correct: 0, incorrect: 0 },
      quizFeedback: null
    }));
  };

  const handleRefresh = () => {
    fetchFlashcards();
    resetQuiz();
    setCardState(prev => ({ ...prev, currentCardIndex: 0 }));
    setUiState(prev => ({ 
      ...prev, 
      showAnswer: false,
      showDetails: false 
    }));
  };

  const toggleGridView = () => {
    setUiState(prev => ({ ...prev, showGrid: !prev.showGrid }));
  };

  return {
    cardState,
    uiState,
    studyState,
    newCard,
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
    sortCardsForSpacedRepetition,
    fetchFlashcards
  };
};