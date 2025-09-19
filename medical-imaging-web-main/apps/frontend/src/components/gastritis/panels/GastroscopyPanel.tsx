// src/components/gastritis/panels/GastroscopyPanel.tsx
import React from 'react';
import { Camera, AlertCircle } from 'lucide-react';
import { useColors } from '@/config/colors';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedButton from '@/components/ui/AnimatedButton';
import { GastroscopyData } from '../types';

interface Props {
  data: GastroscopyData | null;
  onDetailsClick: () => void;
}

const GastroscopyPanel: React.FC<Props> = ({ data, onDetailsClick }) => {
  const colors = useColors();

  return (
    <GlassCard className="h-80 flex flex-col" padding="md">
      <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4`}>胃镜图像</h3>
      <div className="flex-grow overflow-y-auto pr-2">
        {data ? (
          <div className="space-y-4">
            {data.images.slice(0, 2).map((img, index) => (
              <div key={index} className="flex gap-4 items-center">
                <img src={img.src} alt={img.location} className="w-24 h-20 object-cover rounded-lg" />
                <div>
                  <p className={`${colors.textSecondary}`}><span className="font-semibold">部位:</span> {img.location}</p>
                  <p className={`${colors.textSecondary}`}><span className="font-semibold">病变:</span> {img.lesion}</p>
                </div>
              </div>
            ))}
             <div className="mt-4 pt-4 border-t border-white/20">
                <p className={`${colors.textSecondary} flex items-center gap-2`}>
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    <span className="font-semibold">结论:</span> {data.conclusion}
                </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Camera className={`w-12 h-12 ${colors.textSecondary}`} />
            <p className={`mt-2 ${colors.textSecondary}`}>待上传胃镜图像文件</p>
          </div>
        )}
      </div>
       {data && (
          <div className="mt-4 flex justify-end">
            <AnimatedButton variant="ghost" onClick={onDetailsClick} showIcon={false}>详情</AnimatedButton>
          </div>
        )}
    </GlassCard>
  );
};

export default GastroscopyPanel;