export class ErrorHandler {
  static handle(error, operation) {
    console.error(`Failed to ${operation}:`, error);
    return {
      api: `Failed to ${operation}: ${error.message}`,
      db: null,
      ui: null
    };
  }

  static isNetworkError(error) {
    return !window.navigator.onLine || error.name === 'NetworkError';
  }
}