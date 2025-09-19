// src/components/ui/LoadingSpinner.tsx
'use client'
import React from 'react';
import { useColors } from '@/config/colors';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = '检测中...', 
  className = '' 
}) => {
  const colors = useColors();
  
  const sizeClasses = {
    sm: 'w-3 h-3 border-2',
    md: 'w-4 h-4 border-2',
    lg: 'w-6 h-6 border-2'
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} border-white/30 border-t-white rounded-full animate-spin`}></div>
      <span className={colors.textLight}>{text}</span>
    </div>
  );
};

export default LoadingSpinner;