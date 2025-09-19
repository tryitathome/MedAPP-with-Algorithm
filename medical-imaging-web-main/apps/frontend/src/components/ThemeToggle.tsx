// src/components/ThemeToggle.tsx
'use client'
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useColors } from '@/config/colors';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const colors = useColors();
  
  return (
    <button 
      onClick={toggleTheme}
      className={`p-2 rounded-lg ${colors.buttonGhost} border ${colors.glassBorder} transition-all duration-200 hover:scale-105`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-current" />
      ) : (
        <Sun className="w-5 h-5 text-current" />
      )}
    </button>
  );
};

export default ThemeToggle;