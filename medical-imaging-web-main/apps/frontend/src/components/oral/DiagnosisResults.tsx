// src/components/oral/DiagnosisResults.tsx
'use client'
import React from 'react';
import { useColors } from '@/config/colors';
import GlassCard from '@/components/ui/GlassCard';
import { DetectionResults, OralDiagnosisResponse } from '@/types/oral';
import { Patient } from '@shared/types';

interface DiagnosisResultsProps {
  results?: DetectionResults;
  finding?: string;
  recommendation?: string;
  patientData: Patient;
  diagnosisResponse?: OralDiagnosisResponse | null; // 用于读取 predicted_class & confidence
}

const DiagnosisResults: React.FC<DiagnosisResultsProps> = ({ 
  results = { OLP: 0.000, OLK: 0.000, OPMD: 0.000 },
  finding = '无诊断结果',
  recommendation = 'N/A',
  patientData,
  diagnosisResponse
}) => {
  const colors = useColors();
  // 解析二分类置信度
  const predictedClass = diagnosisResponse?.data.results.predicted_class;
  let clsConfidence = diagnosisResponse?.data.results.confidence ?? undefined;
  // 如果后端未返回，尝试从 OPMD 派生（保持兼容）
  if (clsConfidence === undefined && predictedClass) {
    // 保留为空不推导，以免混淆；也可以使用 results.OPMD
    clsConfidence = results?.OPMD;
  }
  const benignConfidence = predictedClass === 'Benign' && clsConfidence !== undefined ? clsConfidence : (predictedClass === 'OPMD' && clsConfidence !== undefined ? 1 - clsConfidence : (1 - (results?.OPMD ?? 0)));
  const opmdConfidence = predictedClass === 'OPMD' && clsConfidence !== undefined ? clsConfidence : (predictedClass === 'Benign' && clsConfidence !== undefined ? 1 - clsConfidence : (results?.OPMD ?? 0));
  const formatPct = (v: number) => (v * 100).toFixed(1) + '%';
  
  return (
    <div className="space-y-6">
      {/* Combined Patient Info and Detection Results Card */}
      <GlassCard className="p-4">
        <h3 className={`text-sm font-semibold ${colors.textPrimary} mb-3`}>
          患者信息
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
          <div className="flex justify-between">
            <span className={`${colors.textSecondary} text-sm`}>患者:</span>
            <span className={`${colors.textPrimary} text-sm`}>{patientData.name}</span>
          </div>
          <div className="flex justify-between">
            <span className={`${colors.textSecondary} text-sm`}>主病案号:</span>
            <span className={`${colors.textPrimary} text-sm`}>{patientData.index}</span>
          </div>
          <div className="flex justify-between">
            <span className={`${colors.textSecondary} text-sm`}>历史诊断:</span>
            <span className={`${colors.textPrimary} text-sm`}>{patientData.history}</span>
          </div>
          <div className="flex justify-between">
            <span className={`${colors.textSecondary} text-sm`}>时间:</span>
            <span className={`${colors.textPrimary} text-sm`}>{patientData.date}</span>
          </div>
          {patientData.biopsyConfirmed !== undefined && (
            <div className="flex justify-between">
              <span className={`${colors.textSecondary} text-sm`}>活检确认:</span>
              <span className={`${colors.textPrimary} text-sm`}>
                {patientData.biopsyConfirmed ? '已确认' : '未确认'}
              </span>
            </div>
          )}
        </div>
        
        {/* Detection Results Section - Always show with default values */}
        <div className="border-t border-white/10 pt-3">
          <h3 className={`text-sm font-semibold ${colors.textPrimary} mb-3`}>
            智能早期筛查结果
          </h3>
          <div className="space-y-4">
            {/* Benign 条 */}
            <div className="space-y-1" key="BenignBar">
              <div className="flex justify-between items-center">
                <span className={`${colors.textSecondary} text-sm`}>健康或其他良性疾病 </span>
                <span className={`${colors.textPrimary} text-sm font-medium`}>{formatPct(benignConfidence)}</span>
              </div>
              <div className="w-full bg-gray-200/20 rounded-full h-2">
                <div className="h-2 rounded-full transition-all duration-300 bg-green-400" style={{ width: `${Math.min(Math.max(benignConfidence * 100, 0), 100)}%` }} />
              </div>
            </div>
            {/* OPMD 条 */}
            <div className="space-y-1" key="OPMDBar">
              <div className="flex justify-between items-center">
                <span className={`${colors.textSecondary} text-sm`}>恶性或潜在恶性疾病</span>
                <span className={`${colors.textPrimary} text-sm font-medium`}>{formatPct(opmdConfidence)}</span>
              </div>
              <div className="w-full bg-gray-200/20 rounded-full h-2">
                <div className="h-2 rounded-full transition-all duration-300 bg-red-400" style={{ width: `${Math.min(Math.max(opmdConfidence * 100, 0), 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
      
      {/* Diagnosis Result Summary - Only show if detection is complete */}
      {(
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className={`text-md font-semibold ${colors.textPrimary}`}>辅助诊断结果:</span>
            <span className={`${colors.textSecondary}`}>{finding}</span>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className={`font-medium ${colors.textPrimary} mb-2`}>诊断建议</h4>
              <p className={`${colors.textSecondary} text-sm leading-relaxed`}>
                {recommendation}
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default DiagnosisResults;