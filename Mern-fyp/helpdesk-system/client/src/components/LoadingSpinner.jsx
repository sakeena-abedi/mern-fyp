const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizes = {
    sm: '20px',
    md: '32px',
    lg: '48px',
  };

  return (
    <div className={`spinner-container spinner-${size}`}>
      <div className="spinner-ring" style={{ width: sizes[size], height: sizes[size] }}></div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
