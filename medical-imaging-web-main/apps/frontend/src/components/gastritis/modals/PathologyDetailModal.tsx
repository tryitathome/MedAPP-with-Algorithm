// src/components/gastritis/modals/PathologyDetailModal.tsx
import React from 'react';
import Modal from '@/components/ui/Modal';
import { PathologyData } from '../types';
import { useColors } from '@/config/colors';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: PathologyData | null;
  onImageDoubleClick: (imageSrc: string) => void;
}

const PathologyDetailModal: React.FC<Props> = ({ isOpen, onClose, data, onImageDoubleClick }) => {
  const colors = useColors();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="病理分析结果" maxWidth="4xl">
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Side */}
        <div 
          className="group cursor-pointer"
          onDoubleClick={() => onImageDoubleClick('/images/pathology-sample.jpg')}
        >
          <img
            src="/images/pathology-sample.jpg" // Placeholder for actual pathology image
            alt="Pathology Sample"
            className="w-full h-96 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
          />
           <p className={`${colors.textSecondary} text-center mt-2 text-sm`}>双击图片可查看大图</p>
        </div>
        
        {/* Text Side */}
        <div className="space-y-6">
          <div>
            <h4 className={`text-lg font-bold ${colors.textPrimary} mb-2`}>病理诊断报告原文:</h4>
            <p className={colors.textSecondary}>
              {data?.diagnosis}
            </p>
          </div>
          <div className="pt-6 border-t border-white/20">
            <h4 className={`text-lg font-bold ${colors.textPrimary} mb-2`}>病理报告分析结果:</h4>
            <p className={`font-semibold text-amber-300`}>
              {data?.analysisResult}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PathologyDetailModal;