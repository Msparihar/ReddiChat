import React, { useState, useEffect } from 'react';

const TypewriterText = ({ 
  text, 
  speed = 50, 
  delay = 0, 
  className = '',
  showCursor = true,
  onComplete 
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, currentIndex === 0 ? delay : speed);

      return () => clearTimeout(timeout);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete && onComplete();
    }
  }, [currentIndex, text, speed, delay, isComplete, onComplete]);

  return (
    <span className={className}>
      {displayText}
      {showCursor && !isComplete && (
        <span className="animate-pulse text-orange-400">|</span>
      )}
    </span>
  );
};

export default TypewriterText;