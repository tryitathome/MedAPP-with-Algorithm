// src/config/colors.ts
import { useTheme } from '@/context/ThemeContext';

// Define sci-fi color palette interface
interface SciFiColorPalette {
  // Background
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textLight: string;
  accent: string;
  
  // Glass morphism
  glassOverlay: string;
  glassHover: string;
  glassBorder: string;
  
  // Buttons
  buttonPrimary: string;
  buttonGhost: string;
  buttonHover: string;
  
  // Effects
  shadow: string;
  glow: string;
  
  // Interactive
  linkHover: string;
  borderAccent: string;
}

// Light theme colors (sci-fi blue variant)
const lightColors: SciFiColorPalette = {
  // Background
  bgPrimary: 'bg-gradient-to-br from-blue-50 to-indigo-100',
  bgSecondary: 'bg-white/80',
  bgTertiary: 'bg-blue-50/50',
  
  // Text
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-600',
  textLight: 'text-white',
  accent: 'text-blue-600',
  
  // Glass morphism
  glassOverlay: 'bg-white/20 backdrop-blur-md',
  glassHover: 'hover:bg-white/30',
  glassBorder: 'border-white/30',
  
  // Buttons
  buttonPrimary: 'bg-blue-600 hover:bg-blue-700',
  buttonGhost: 'bg-white/10 hover:bg-white/20 backdrop-blur-sm',
  buttonHover: 'hover:bg-blue-700',
  
  // Effects
  shadow: 'shadow-xl shadow-blue-500/20',
  glow: 'shadow-lg shadow-blue-400/30',
  
  // Interactive
  linkHover: 'hover:text-blue-600',
  borderAccent: 'border-blue-500/50',
};

// Dark theme colors (primary sci-fi theme)
const darkColors: SciFiColorPalette = {
  // Background
  bgPrimary: 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900',
  bgSecondary: 'bg-slate-800/80',
  bgTertiary: 'bg-slate-700/50',
  
  // Text
  textPrimary: 'text-white',
  textSecondary: 'text-blue-200',
  textLight: 'text-white',
  accent: 'text-blue-400',
  
  // Glass morphism
  glassOverlay: 'bg-white/10 backdrop-blur-md',
  glassHover: 'hover:bg-white/20',
  glassBorder: 'border-white/20',
  
  // Buttons
  buttonPrimary: 'bg-blue-600 hover:bg-blue-500',
  buttonGhost: 'bg-white/10 hover:bg-white/20 backdrop-blur-sm',
  buttonHover: 'hover:bg-blue-500',
  
  // Effects
  shadow: 'shadow-xl shadow-blue-500/30',
  glow: 'shadow-lg shadow-blue-400/40',
  
  // Interactive
  linkHover: 'hover:text-blue-400',
  borderAccent: 'border-blue-500/50',
};

// Custom hook that provides the color palette based on current theme
export const useColors = (): SciFiColorPalette => {
  const { theme } = useTheme();
  return theme === 'dark' ? darkColors : lightColors;
};

// Helper function to get specific colors without the hook (for static contexts)
export const getColors = (theme: 'light' | 'dark'): SciFiColorPalette => {
  return theme === 'dark' ? darkColors : lightColors;
};