import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app title', () => {
  render(<App />);
  const titleElement = screen.getByText(/German Flashcard App/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders study modes', () => {
  render(<App />);
  expect(screen.getByText(/Normal Mode/i)).toBeInTheDocument();
  expect(screen.getByText(/Quiz Mode/i)).toBeInTheDocument();
  expect(screen.getByText(/Spaced Repetition/i)).toBeInTheDocument();
});
