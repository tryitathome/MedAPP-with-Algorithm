// src/components/ui/GlassCard.tsx
'use client'
import React, { ReactNode } from 'react';
import { useColors } from '@/config/colors';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hover = true,
  padding = 'md',
  rounded = '2xl'
}) => {
  const colors = useColors();
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl'
  };
  
  return (
    <div className={`
      ${colors.glassOverlay} 
      ${hover ? colors.glassHover : ''} 
      ${roundedClasses[rounded]}
      ${paddingClasses[padding]}
      border ${colors.glassBorder}
      backdrop-blur-md 
      transition-all duration-300
      ${className}
    `}>
      {children}
    </div>
  );
};

export default GlassCard;