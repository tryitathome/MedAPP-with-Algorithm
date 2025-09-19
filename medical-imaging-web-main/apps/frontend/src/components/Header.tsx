// src/components/Header.tsx
'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useColors } from '@/config/colors';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
  const colors = useColors();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const navItems = [
    { path: '/#features', label: 'Features' },
    { path: '/#about', label: 'About' },
    { path: '/#contact', label: 'Contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'backdrop-blur-md' : ''
    }`}>
      <div className={`${colors.glassOverlay} border-b ${colors.glassBorder}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              {/* <div className="w-10 h-10 bg-blue-500 rounded-lg transition-transform duration-300 group-hover:scale-110">
              </div> */}
              <span className={`text-xl font-bold ${colors.textPrimary} transition-colors ml-6`}>
                AI医学影像综合检测平台
              </span>
            </Link>
            
            {/* Desktop Navigation - Right Aligned */}
            <div className="hidden md:flex items-center gap-8">
              {/* <nav className="flex items-center gap-8">
                {navItems.map((item) => (
                  <a 
                    key={item.path}
                    href={item.path} 
                    className={`${colors.textSecondary} ${colors.linkHover} transition-colors duration-300 hover:scale-105 transform`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav> */}
              
              <ThemeToggle />
            </div>
            
            {/* Mobile Menu Button */}
            <div className="flex items-center gap-4 md:hidden">
              <ThemeToggle />
              
              <button
                onClick={toggleMobileMenu}
                className={`p-2 rounded-lg ${colors.buttonGhost} border ${colors.glassBorder} transition-all duration-200`}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {/* {mobileMenuOpen && (
          <div className={`md:hidden ${colors.glassOverlay} border-t ${colors.glassBorder}`}>
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <a 
                    key={item.path}
                    href={item.path} 
                    className={`${colors.textSecondary} ${colors.linkHover} transition-colors duration-300 py-2`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        )} */}
      </div>
    </header>
  );
};

export default Header;