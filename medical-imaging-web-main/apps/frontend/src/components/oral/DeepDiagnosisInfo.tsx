// src/components/oral/DeepDiagnosisInfo.tsx
'use client'
import React from 'react';
import { useColors } from '@/config/colors';
import GlassCard from '@/components/ui/GlassCard';
import { DeepDetectionResults } from '@/types/oral';
import { Patient } from '@shared/types';

interface DeepDiagnosisInfoProps {
  results?: DeepDetectionResults;
  patientData: Patient;
  finding?: string;
  recommendation?: string;
}

const DeepDiagnosisInfo: React.FC<DeepDiagnosisInfoProps> = ({
  results = { OLP: 0, OLK: 0, OSF: 0 },
  patientData,
  finding = '无深度检测结果',
  recommendation = 'N/A'
}) => {
  const colors = useColors();

  return (
    <div className="space-y-6">
      {/* 患者信息和深度分类结果 */}
      <GlassCard className="p-4">
        <h3 className={`text-sm font-semibold ${colors.textPrimary} mb-3`}>深度检测患者信息</h3>
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
        
        <div className="border-t border-white/10 pt-3">
          <h3 className={`text-sm font-semibold ${colors.textPrimary} mb-3`}>智能诊断辅助 置信度可视化</h3>
          <div className="space-y-2">
        {[
          { key: 'OLK', label: '口腔白斑病（OLK）' },
          { key: 'OLP', label: '口腔扁平苔藓（OLP）' },
          { key: 'OSF', label: '口腔黏膜下纤维化（OSF）' },
        //  { key: 'OPMD', label: '口腔黏膜潜在恶性疾病（OPMD）' }    //如果需要展示OPMD的检测置信度则启动这一行
        ].map(({ key, label }) => {
          const value = (results as any)[key] || 0;
          const barWidth = Math.min(Math.max(value * 100, 0), 100);
          const colorIntensity = Math.min(Math.max(value, 0), 1);
          const backgroundColor = `hsl(${45 - (colorIntensity * 25)}, 100%, ${60 - (colorIntensity * 10)}%)`;
          return (
            <div key={key} className="space-y-1">
          <div className="flex justify-between items-center">
            <span className={`${colors.textSecondary} text-sm`}>{label}:</span>
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
      
      {/* 深度检测诊断结果 - 给予更多空间 */}
      <GlassCard className="p-6">
        <div className="flex justify-between items-start mb-6">
          <span className={`text-lg font-semibold ${colors.textPrimary}`}>诊断结果:</span>
          <span className={`${colors.textSecondary} text-base`}>{finding}</span>
        </div>
        <div className="space-y-6">
          <div>
            <h4 className={`font-semibold ${colors.textPrimary} mb-4 text-base`}>诊断建议</h4>
            <div className={`${colors.textSecondary} text-sm leading-relaxed bg-blue-50/10 p-4 rounded-lg border border-blue-200/20`}>
              <p>{recommendation}</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default DeepDiagnosisInfo;
