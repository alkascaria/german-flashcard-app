import PropTypes from 'prop-types';

export const LoadingOverlay = ({ isVisible, message }) => {
  if (!isVisible) return null;
  
  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

LoadingOverlay.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  message: PropTypes.string
};

export default LoadingOverlay; // Add default export