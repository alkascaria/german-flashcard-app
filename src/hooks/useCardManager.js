import { useState } from 'react';

export const useCardManager = () => {
  const [cardState, setCardState] = useState({
    flashcards: [],
    filteredCards: [],
    currentCardIndex: 0,
    categories: []
  });

  const handleAddCard = async (newCard) => {
    // ... add card logic
  };

  const handleDelete = async (id) => {
    // ... delete logic
  };

  return {
    cardState,
    setCardState,
    handleAddCard,
    handleDelete
  };
};