// src/components/oral/DeepDiagnosisResults.tsx
'use client'
import React, { useMemo, useState } from 'react';
import { useColors } from '@/config/colors';
import GlassCard from '@/components/ui/GlassCard';
import { DeepDetectionResults } from '@/types/oral';
import { Patient } from '@shared/types';

interface DeepDiagnosisResultsProps {
  results?: DeepDetectionResults;
  patientData: Patient;
  finding?: string;
  recommendation?: string;
}

const DeepDiagnosisResults: React.FC<DeepDiagnosisResultsProps> = ({
  results = { OLP: 0, OLK: 0, OSF: 0 },
  patientData,
  finding = '无深度检测结果',
  recommendation = 'N/A'
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

  return (
    <div className="space-y-6">
      <GlassCard className="p-4">
        <h3 className={`text-sm font-semibold ${colors.textPrimary} mb-3`}>深度检测患者信息</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
          <div className="flex justify-between"><span className={`${colors.textSecondary} text-sm`}>患者:</span><span className={`${colors.textPrimary} text-sm`}>{patientData.name}</span></div>
          <div className="flex justify-between"><span className={`${colors.textSecondary} text-sm`}>主病案号:</span><span className={`${colors.textPrimary} text-sm`}>{patientData.index}</span></div>
          <div className="flex justify-between"><span className={`${colors.textSecondary} text-sm`}>历史诊断:</span><span className={`${colors.textPrimary} text-sm`}>{patientData.history}</span></div>
          <div className="flex justify-between"><span className={`${colors.textSecondary} text-sm`}>时间:</span><span className={`${colors.textPrimary} text-sm`}>{patientData.date}</span></div>
          {patientData.biopsyConfirmed !== undefined && (
            <div className="flex justify-between">
              <span className={`${colors.textSecondary} text-sm`}>活检确认:</span>
              <span className={`${colors.textPrimary} text-sm`}>
                {patientData.biopsyConfirmed ? '已确认' : '未确认'}
              </span>
            </div>
          )}
        </div>
        <div className="border-t border-white/10 pt-3">
          <h3 className={`text-sm font-semibold ${colors.textPrimary} mb-3`}>智能辅助诊断结果</h3>
          <div className="space-y-2">
            {['OLK','OLP','OSF','OPMD'].map(key => {
              const value = (results as any)[key] || 0;
              const barWidth = Math.min(Math.max(value * 100, 0), 100);
              const colorIntensity = Math.min(Math.max(value, 0), 1);
              const backgroundColor = `hsl(${45 - (colorIntensity * 25)}, 100%, ${60 - (colorIntensity * 10)}%)`;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className={`${colors.textSecondary} text-sm`}>{key}:</span>
                    <span className={`${colors.textPrimary} text-sm font-medium`}>{value.toFixed(3)}</span>
                  </div>
                  <div className="w-full bg-gray-200/20 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${barWidth}%`, backgroundColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
      {annotatedImgSrc && (
        <GlassCard className="p-4">
          <h3 className={`text-sm font-semibold ${colors.textPrimary} mb-3`}>检测框可视化</h3>
          <div className="w-full border border-white/10 rounded-lg overflow-hidden">
            {!imageError ? (
              <img 
                key={`${annotatedImgSrc}-${retryCount}`}
                src={annotatedImgSrc} 
                alt="深度检测可视化" 
                className="w-full object-contain max-h-[480px]" 
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
      )}
      <GlassCard className="p-6">
        <div className="flex justify-between items-center mb-4">
          <span className={`text-md font-semibold ${colors.textPrimary}`}>深度检测诊断结果:</span>
          <span className={`${colors.textSecondary}`}>{finding}</span>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className={`font-medium ${colors.textPrimary} mb-2`}>诊断建议</h4>
            <p className={`${colors.textSecondary} text-sm leading-relaxed`}>{recommendation}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default DeepDiagnosisResults;
