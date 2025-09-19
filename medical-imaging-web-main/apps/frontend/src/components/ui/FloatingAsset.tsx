// src/components/ui/FloatingAsset.tsx
'use client'
import React, { useState, useEffect, ReactNode } from 'react';

interface FloatingAssetProps {
  children: ReactNode;
  delay?: number;
  amplitude?: number;
  duration?: number;
  className?: string;
}

const FloatingAsset: React.FC<FloatingAssetProps> = ({ 
  children, 
  delay = 0, 
  amplitude = 20,
  duration = 4,
  className = ''
}) => {
  const [offset, setOffset] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Start animation after delay
    const visibilityTimeout = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);
    
    // Start floating animation
    const startTime = Date.now() + delay * 1000;
    let animationId: number;
    
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newOffset = Math.sin(elapsed * (2 * Math.PI / duration)) * amplitude;
      setOffset(newOffset);
      animationId = requestAnimationFrame(animate);
    };
    
    const animationTimeout = setTimeout(() => {
      animate();
    }, delay * 1000);
    
    return () => {
      clearTimeout(visibilityTimeout);
      clearTimeout(animationTimeout);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [delay, amplitude, duration]);
  
  return (
    <div 
      className={`transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
      style={{ 
        transform: `translateY(${offset}px)`,
        transitionDelay: `${delay * 0.1}s`
      }}
    >
      {children}
    </div>
  );
};

export default FloatingAsset;