// src/components/ui/AnimatedButton.tsx
'use client'
import React, { useState, ReactNode, ButtonHTMLAttributes } from 'react';
import { ChevronRight } from 'lucide-react';
import { useColors } from '@/config/colors';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  className?: string;
  showIcon?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  showIcon = true,
  onClick,
  ...props 
}) => {
  const colors = useColors();
  const [isHovered, setIsHovered] = useState(false);
  
  const baseClasses = "px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2 border";
  
  const variants = {
    primary: `${colors.buttonPrimary} ${colors.textLight} ${colors.borderAccent} ${colors.shadow}`,
    ghost: `${colors.buttonGhost} ${colors.textLight} ${colors.glassBorder}`,
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      {...props}
    >
      {children}
      {variant === 'primary' && showIcon && (
        <ChevronRight 
          className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} 
        />
      )}
    </button>
  );
};

export default AnimatedButton;