// src/app/page.tsx
'use client'
import React from 'react';
import HeroSection from '@/components/sections/HeroSection';
import { useColors } from '@/config/colors';

const HomePage: React.FC = () => {
  const colors = useColors();
  
  return (
    <main className={`${colors.bgPrimary} min-h-screen`}>
      <HeroSection />
    </main>
  );
};

export default HomePage;