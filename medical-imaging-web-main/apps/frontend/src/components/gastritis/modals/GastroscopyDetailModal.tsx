// src/components/gastritis/modals/GastroscopyDetailModal.tsx
import React from 'react';
import Modal from '@/components/ui/Modal';
import { GastroscopyData } from '../types';
import { useColors } from '@/config/colors';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: GastroscopyData | null;
  onImageDoubleClick: (imageSrc: string) => void;
}

const GastroscopyDetailModal: React.FC<Props> = ({ isOpen, onClose, data, onImageDoubleClick }) => {
  const colors = useColors();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="胃镜分析结果详情" maxWidth="4xl">
      <div className="p-6 space-y-6">
        <p className={colors.textSecondary}>双击图片可查看大图。</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.images.map((image, index) => (
            <div 
              key={index} 
              className="group cursor-pointer"
              onDoubleClick={() => onImageDoubleClick(image.src)}
            >
              <img 
                src={image.src} 
                alt={image.location} 
                className="w-full h-48 object-cover rounded-lg mb-2 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="text-center">
                 <p className={`${colors.textSecondary}`}><span className="font-semibold">部位:</span> {image.location}</p>
                 <p className={`${colors.textSecondary}`}><span className="font-semibold">病变:</span> {image.lesion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default GastroscopyDetailModal;