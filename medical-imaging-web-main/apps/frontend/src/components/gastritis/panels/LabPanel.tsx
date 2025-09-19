// src/components/gastritis/panels/LabPanel.tsx
import React from 'react';
import { Beaker, AlertCircle } from 'lucide-react';
import { useColors } from '@/config/colors';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedButton from '@/components/ui/AnimatedButton'; // Import button
import { LabData } from '../types';

interface Props {
  data: LabData | null;
  onDetailsClick: () => void; // Add prop
}

const LabPanel: React.FC<Props> = ({ data, onDetailsClick }) => {
  const colors = useColors();

  return (
    <GlassCard className="h-80 flex flex-col" padding="md">
      <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4`}>实验室检验结果</h3>
      <div className="flex-grow overflow-y-auto pr-2 text-sm">
        {data ? (
          <div className="space-y-4">
            <div>
              <p className={`font-semibold ${colors.textPrimary} mb-1`}>实验室检验异常指标:</p>
              <ul className="list-disc list-inside space-y-1">
                {data.abnormalIndicators.map((item, i) => (
                  <li key={i} className={colors.textSecondary}>{item}</li>
                ))}
              </ul>
            </div>
             <div className="mt-4 pt-4 border-t border-white/20">
              <p className={`${colors.textSecondary} flex items-center gap-2`}>
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span className="font-semibold">分析结果:</span> {data.analysisResult}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Beaker className={`w-12 h-12 ${colors.textSecondary}`} />
            <p className={`mt-2 ${colors.textSecondary}`}>待上传血清检查文件</p>
          </div>
        )}
      </div>
      {/* Add Details Button */}
      {data && (
        <div className="mt-4 flex justify-end">
          <AnimatedButton variant="ghost" onClick={onDetailsClick} showIcon={false}>详情</AnimatedButton>
        </div>
      )}
    </GlassCard>
  );
};

export default LabPanel;