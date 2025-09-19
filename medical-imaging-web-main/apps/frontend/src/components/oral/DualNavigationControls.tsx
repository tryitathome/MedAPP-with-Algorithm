// components/oral/DualNavigationControls.tsx
'use client'
import React from 'react';
import { ChevronLeft, ChevronRight, User, Image } from 'lucide-react';
import { useColors } from '@/config/colors';

interface DualNavigationControlsProps {
  // 患者导航
  currentPatientInfo: string;
  canNavigatePrevPatient: boolean;
  canNavigateNextPatient: boolean;
  onPrevPatient: () => void;
  onNextPatient: () => void;
  
  // 图片导航
  currentImageInfo: string;
  canNavigatePrevImage: boolean;
  canNavigateNextImage: boolean;
  onPrevImage: () => void;
  onNextImage: () => void;
  
  // 状态
  isDisabled?: boolean;
}

const DualNavigationControls: React.FC<DualNavigationControlsProps> = ({
  currentPatientInfo,
  canNavigatePrevPatient,
  canNavigateNextPatient,
  onPrevPatient,
  onNextPatient,
  currentImageInfo,
  canNavigatePrevImage,
  canNavigateNextImage,
  onPrevImage,
  onNextImage,
  isDisabled = false
}) => {
  const colors = useColors();
  
  return (
    <div className="space-y-4">
      {/* 患者级导航 */}
      <div className={`flex items-center justify-between p-3 rounded-lg bg-blue-50/10 border border-blue-200/20`}>
        <button
          onClick={onPrevPatient}
          disabled={isDisabled || !canNavigatePrevPatient}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200
            ${isDisabled || !canNavigatePrevPatient
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:bg-blue-100/20 active:scale-95'
            }
          `}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">前一患者</span>
        </button>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-md">
          <User className={`w-4 h-4 ${colors.textPrimary}`} />
          <span className={`text-sm font-medium ${colors.textPrimary}`}>
            {currentPatientInfo}
          </span>
        </div>
        
        <button
          onClick={onNextPatient}
          disabled={isDisabled || !canNavigateNextPatient}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200
            ${isDisabled || !canNavigateNextPatient
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:bg-blue-100/20 active:scale-95'
            }
          `}
        >
          <span className="text-sm">后一患者</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* 图片级导航 */}
      <div className={`flex items-center justify-between p-3 rounded-lg bg-green-50/10 border border-green-200/20`}>
        <button
          onClick={onPrevImage}
          disabled={isDisabled || !canNavigatePrevImage}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200
            ${isDisabled || !canNavigatePrevImage
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-green-600 hover:bg-green-100/20 active:scale-95'
            }
          `}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">前一图片</span>
        </button>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-md">
          <Image className={`w-4 h-4 ${colors.textPrimary}`} />
          <span className={`text-sm font-medium ${colors.textPrimary}`}>
            {currentImageInfo}
          </span>
        </div>
        
        <button
          onClick={onNextImage}
          disabled={isDisabled || !canNavigateNextImage}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200
            ${isDisabled || !canNavigateNextImage
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-green-600 hover:bg-green-100/20 active:scale-95'
            }
          `}
        >
          <span className="text-sm">后一图片</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DualNavigationControls;
