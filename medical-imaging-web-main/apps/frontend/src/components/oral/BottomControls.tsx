// src/components/oral/BottomControls.tsx
import React from 'react';
import { ChevronLeft, ChevronRight, Download, BookOpen } from 'lucide-react';
import { useColors } from '@/config/colors';

interface BottomControlsProps {
  selectedImage: string | null;
  isDetecting: boolean;
  onStartDetection: () => void;
  currentPatient: number;
  totalPatients: number;
  onPrevPatient: () => void;
  onNextPatient: () => void;
  buttonsEnabled: boolean;
  onShowReport: () => void;
  onShowKnowledge: () => void;
  // 图片导航相关（可选，当有批量导入时才显示）
  currentImageIndex?: number;
  totalImages?: number;
  onPrevImage?: () => void;
  onNextImage?: () => void;
  canNavigatePrevImage?: boolean;
  canNavigateNextImage?: boolean;
  // 接口模式
  interfaceMode?: 'none' | 'single' | 'folder';
}

const BottomControls: React.FC<BottomControlsProps> = ({
  selectedImage,
  isDetecting,
  onStartDetection,
  currentPatient,
  totalPatients,
  onPrevPatient,
  onNextPatient,
  buttonsEnabled,
  onShowReport,
  onShowKnowledge,
  // 图片导航
  currentImageIndex = 0,
  totalImages = 0,
  onPrevImage,
  onNextImage,
  canNavigatePrevImage = false,
  canNavigateNextImage = false,
  // 接口模式
  interfaceMode = 'none'
}) => {
  const colors = useColors();
  
  // 在folder模式下强制显示图片导航，即使只有一张图片
  const shouldShowImageNavigation = interfaceMode === 'folder' || totalImages > 1;
  
  return (
    <div className="space-y-4">
      {/* 主控制区域 */}
      <div className="flex justify-between items-center">
        {/* Left side - Image Navigation - Takes half width */}
        <div className="flex items-center justify-between w-1/2">
          {shouldShowImageNavigation ? (
            // 当应该显示图片导航时（folder模式或多张图片）
            <>
              <button
                onClick={onPrevImage}
                disabled={!canNavigatePrevImage}
                className={`p-3 rounded-lg ${!canNavigatePrevImage ? 'bg-gray-500/50 cursor-not-allowed' : colors.buttonGhost} transition-colors`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <span className={`${colors.textPrimary} font-medium`}>
                第 {currentImageIndex + 1} 张，共 {totalImages} 张
              </span>
              
              <button
                onClick={onNextImage}
                disabled={!canNavigateNextImage}
                className={`p-3 rounded-lg ${!canNavigateNextImage ? 'bg-gray-500/50 cursor-not-allowed' : colors.buttonGhost} transition-colors`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            // 当不需要显示图片导航时显示占位符
            <span className={`${colors.textPrimary} font-medium`}>
              {totalImages === 1 ? '当前图片' : interfaceMode === 'single' ? '单文件模式' : '请选择图片'}
            </span>
          )}
        </div>
        
        {/* 注释掉的患者导航 - 暂时不使用 */}
        {/* 
        <div className="flex items-center justify-between w-1/2">
          <button
            onClick={onPrevPatient}
            disabled={currentPatient === 0}
            className={`p-3 rounded-lg ${currentPatient === 0 ? 'bg-gray-500/50 cursor-not-allowed' : colors.buttonGhost} transition-colors`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className={`${colors.textPrimary} font-medium`}>
            前一患者 | 后一患者
          </span>
          
          <button
            onClick={onNextPatient}
            disabled={(currentPatient === totalPatients - 1) || totalPatients === 0}
            className={`p-3 rounded-lg ${((currentPatient === totalPatients - 1) || totalPatients === 0) ? 'bg-gray-500/50 cursor-not-allowed' : colors.buttonGhost} transition-colors`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        */}
        
        {/* Right side - Knowledge, Report and Detection buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={onShowKnowledge}
            disabled={!buttonsEnabled}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${buttonsEnabled ? colors.buttonPrimary : 'bg-gray-500/50 cursor-not-allowed'} ${colors.textLight} border ${colors.borderAccent} ${colors.shadow} flex items-center gap-2`}
          >
            <BookOpen className="w-5 h-5" />
            医学知识宣讲
          </button>
          
          <button
            onClick={onShowReport}
            disabled={!buttonsEnabled}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${buttonsEnabled ? colors.buttonPrimary : 'bg-gray-500/50 cursor-not-allowed'} ${colors.textLight} border ${colors.borderAccent} ${colors.shadow} flex items-center gap-2`}
          >
            <Download className="w-5 h-5" />
            详细报告
          </button>
          
          <button
            onClick={onStartDetection}
            disabled={!selectedImage || isDetecting}
            className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
              selectedImage && !isDetecting 
                ? colors.buttonPrimary 
                : 'bg-gray-500/50 cursor-not-allowed'
            } ${colors.textLight} border ${colors.borderAccent} ${colors.shadow}`}
          >
            {isDetecting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                检测中...
              </div>
            ) : (
              '开始检测'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomControls;