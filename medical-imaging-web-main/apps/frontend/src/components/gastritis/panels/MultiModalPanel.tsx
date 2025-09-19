// src/components/gastritis/panels/MultiModalPanel.tsx
import React from 'react';
import { BrainCircuit, Bot } from 'lucide-react';
import { useColors } from '@/config/colors';
import GlassCard from '@/components/ui/GlassCard';
import { DiagnosisResult } from '../types';

interface Props {
  data: DiagnosisResult | null;
}

const MultiModalPanel: React.FC<Props> = ({ data }) => {
  const colors = useColors();

  return (
    <GlassCard className="h-80 flex flex-col" padding="md">
      <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4`}>多模态诊断结果</h3>
      <div className="flex-grow overflow-y-auto pr-2 text-sm">
        {data ? (
          <div className="space-y-4">
            <div>
              <p className={`font-semibold ${colors.textPrimary} mb-2`}>多模态预测结果:</p>
              <div className="space-y-2">
                {data.predictions.map(p => (
                  <div key={p.name} className="flex items-center justify-between">
                    <span className={colors.textSecondary}>{p.name}</span>
                    <div className="w-1/2 bg-white/20 rounded-full h-2.5">
                      <div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: `${p.value * 100}%`}}></div>
                    </div>
                    <span className={`font-mono text-cyan-300`}>{(p.value * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
             <div>
              <p className={`font-semibold ${colors.textPrimary} mt-4 mb-2`}>模态权重分析:</p>
               <div className="space-y-1">
                {data.modalWeights.map(m => (
                    <div key={m.name} className="flex justify-between items-center">
                      <span className={colors.textSecondary}>{m.name}</span>
                      <span className="font-mono text-purple-300">{m.value.toFixed(3)}</span>
                    </div>
                ))}
               </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className={`${colors.textPrimary} text-base flex items-center gap-2`}>
                <Bot className="w-5 h-5 text-green-400"/>
                <span className="font-semibold">智能化诊断结果:</span>
                <span className="font-bold text-green-300">{data.finalConclusion}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BrainCircuit className={`w-12 h-12 ${colors.textSecondary}`} />
            <p className={`mt-2 ${colors.textSecondary}`}>待生成诊断结果</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default MultiModalPanel;