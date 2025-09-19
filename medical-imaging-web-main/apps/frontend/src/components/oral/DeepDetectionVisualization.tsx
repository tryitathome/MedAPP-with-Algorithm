// src/components/oral/DeepDetectionVisualization.tsx
'use client'
import React, { useMemo, useState } from 'react';
import { useColors } from '@/config/colors';
import GlassCard from '@/components/ui/GlassCard';
import { DeepDetectionResults } from '@/types/oral';

interface DeepDetectionVisualizationProps {
  results?: DeepDetectionResults;
}

const DeepDetectionVisualization: React.FC<DeepDetectionVisualizationProps> = ({
  results
}) => {
  const colors = useColors();
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // 前端环境变量若配置为 http://localhost:5050/api 需要去掉 /api 用于静态资源
  const rawApiBase = process.env.NEXT_PUBLIC_API_URL || '';
  const apiBase = rawApiBase.replace(/\/api\/?$/, '');
  const annotatedImgSrc = useMemo(() => {
    if (!results?.annotatedImage) return '';
    const val = results.annotatedImage;
    if (/^https?:\/\//i.test(val)) return val; // already absolute
    return `${apiBase}${val.startsWith('/') ? '' : '/'}${val}`;
  }, [results?.annotatedImage, apiBase]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('[DeepDetection][Image] 加载失败:', annotatedImgSrc);
    console.error('[DeepDetection][Image] API Base:', apiBase);
    console.error('[DeepDetection][Image] Raw URL:', results?.annotatedImage);
    setImageError(true);
    (e.currentTarget as HTMLImageElement).style.opacity = '0.4';
  };

  const handleRetry = () => {
    setImageError(false);
    setRetryCount(prev => prev + 1);
  };

  if (!annotatedImgSrc) {
    return null;
  }

  return (
    <GlassCard className="p-4">
      <h3 className={`text-sm font-semibold ${colors.textPrimary} mb-3`}>检测框可视化</h3>
      <div className="w-full border border-white/10 rounded-lg overflow-hidden">
        {!imageError ? (
          <img 
            key={`${annotatedImgSrc}-${retryCount}`}
            src={annotatedImgSrc} 
            alt="深度检测可视化" 
            className="w-full object-contain max-h-[400px]" 
            onError={handleImageError}
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-48 flex flex-col items-center justify-center bg-gray-100/10 text-center p-4">
            <p className={`${colors.textSecondary} text-sm mb-3`}>图片加载失败</p>
            <p className={`${colors.textSecondary} text-xs mb-3 break-all`}>URL: {annotatedImgSrc}</p>
            <button 
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              重试加载
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default DeepDetectionVisualization;
