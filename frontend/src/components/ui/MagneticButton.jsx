import React, { useRef, useEffect } from 'react';

const MagneticButton = ({ children, className = '', intensity = 0.1, disabled = false, ...props }) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button || disabled) return;

    const handleMouseMove = (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = Math.max(rect.width, rect.height);
      
      if (distance < maxDistance) {
        const moveX = x * intensity;
        const moveY = y * intensity;
        
        button.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.02)`;
      }
    };

    const handleMouseLeave = () => {
      button.style.transform = 'translate(0px, 0px) scale(1)';
    };

    const handleMouseEnter = () => {
      if (disabled) return;
      button.style.transform = 'scale(1.02)';
    };

    button.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseleave', handleMouseLeave);
    button.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      button.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
      button.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [intensity, disabled]);

  return (
    <button
      ref={buttonRef}
      className={`transition-all duration-200 ease-out transform-gpu ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default MagneticButton;