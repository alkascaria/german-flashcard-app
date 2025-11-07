const API_BASE_URL = 'http://localhost:5000/api';

export const flashcardApi = {
  async getFlashcards() {
    try {
      const response = await fetch(`${API_BASE_URL}/flashcards`);
      if (!response.ok) throw new Error('Failed to fetch flashcards');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async addFlashcard(cardData) {
    try {
      const response = await fetch(`${API_BASE_URL}/flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });
      if (!response.ok) throw new Error('Failed to add flashcard');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async updateFlashcard(id, cardData) {
    try {
      const response = await fetch(`${API_BASE_URL}/flashcards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });
      if (!response.ok) throw new Error('Failed to update flashcard');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async deleteFlashcard(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/flashcards/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete flashcard');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};