// src/components/sections/HeroSection.tsx
'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useColors } from '@/config/colors';
import FloatingAsset from '@/components/ui/FloatingAsset';
import GlassCard from '@/components/ui/GlassCard';

const HeroSection: React.FC = () => {
  const colors = useColors();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);
  
  const handleNavigation = (path: string) => {
    router.push(path);
  };
  
  return (
    <section className={`min-h-screen ${colors.bgPrimary} relative overflow-hidden flex items-center justify-center pt-30 pb-30`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center">
          {/* Main Content */}
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>            
            <h1 className={`font-bold ${colors.textPrimary} mb-6 leading-tight`}>
              <div className="text-3xl md:text-4xl lg:text-5xl mb-2">
                欢迎来到
              </div>
              <div className="text-4xl md:text-6xl lg:text-7xl bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                AI医学影像综合检测平台
              </div>
            </h1>
            
            <p className={`text-lg md:text-xl ${colors.textSecondary} max-w-2xl mx-auto mb-8 leading-relaxed`}>
              运用先进的人工智能技术，为医学影像诊断提供精准、高效的辅助检测服务，助力医疗诊断的智能化发展
            </p>
          </div>
          
          {/* Medical Imaging Cards */}
          <div className="mt-16 relative max-w-4xl mx-auto">
            {/* First Row - Oral Mucosal & Gastritis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <FloatingAsset delay={0.5} amplitude={15}>
                <button 
                  onClick={() => handleNavigation('/oral')}
                  className="w-full transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-xl"
                >
                  <GlassCard className="w-full h-40 p-6 hover:bg-white/20 transition-colors duration-200">
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <h4 className={`text-2xl font-bold ${colors.textPrimary} mb-3`}>口腔黏膜</h4>
                        <p className={`text-base ${colors.textSecondary}`}>潜在恶性疾病诊断辅助</p>
                      </div>
                    </div>
                  </GlassCard>
                </button>
              </FloatingAsset>
              
              <FloatingAsset delay={0.75} amplitude={25}>
                <button 
                  onClick={() => handleNavigation('/gastritis')}
                  className="w-full transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-xl"
                >
                  <GlassCard className="w-full h-40 p-6 hover:bg-white/20 transition-colors duration-200">
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <h4 className={`text-2xl font-bold ${colors.textPrimary} mb-3`}>委缩性胃炎</h4>
                        <p className={`text-base ${colors.textSecondary}`}>诊断辅助</p>
                      </div>
                    </div>
                  </GlassCard>
                </button>
              </FloatingAsset>
            </div>
            
            {/* Second Row - Immunohistochemistry & Chemotherapy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FloatingAsset delay={1.0} amplitude={20}>
                <button 
                  // onClick={() => handleNavigation('/immunohistochemistry')}
                  className="w-full transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-xl"
                >
                  <GlassCard className="w-full h-40 p-6 hover:bg-white/20 transition-colors duration-200">
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <h4 className={`text-2xl font-bold ${colors.textPrimary} mb-3`}>免疫组化图像</h4>
                        <p className={`text-base ${colors.textSecondary}`}>分割评估</p>
                      </div>
                    </div>
                  </GlassCard>
                </button>
              </FloatingAsset>
              
              <FloatingAsset delay={1.25} amplitude={18}>
                <button 
                  // onClick={() => handleNavigation('/chemotherapy')}
                  className="w-full transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-xl"
                >
                  <GlassCard className="w-full h-40 p-6 hover:bg-white/20 transition-colors duration-200">
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <h4 className={`text-2xl font-bold ${colors.textPrimary} mb-3`}>日间化疗中心</h4>
                        <p className={`text-base ${colors.textSecondary}`}>监测辅助</p>
                      </div>
                    </div>
                  </GlassCard>
                </button>
              </FloatingAsset>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;