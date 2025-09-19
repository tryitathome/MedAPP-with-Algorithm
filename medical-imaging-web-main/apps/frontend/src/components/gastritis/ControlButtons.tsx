// src/components/gastritis/ControlButtons.tsx
import React from 'react';
import { Upload, Zap, Trash2, ArrowLeft, FileText } from 'lucide-react';
import AnimatedButton from '../ui/AnimatedButton';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Props {
  onUpload: (type: 'gastroscopy' | 'pathology' | 'lab') => void;
  onDiagnose: () => void;
  onClear: () => void;
  onBack: () => void;
  onViewReport: () => void; // New prop
  isLoading: boolean;
  canDiagnose: boolean;
  showReportButton: boolean; // New prop
}

const ControlButtons: React.FC<Props> = ({ 
  onUpload, 
  onDiagnose, 
  onClear, 
  onBack, 
  onViewReport,
  isLoading, 
  canDiagnose,
  showReportButton
}) => {
  return (
    <div className="mt-6 pt-6 border-t border-white/20 flex flex-wrap items-center justify-between gap-4">
      <AnimatedButton variant="ghost" onClick={onBack} showIcon={false}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回
      </AnimatedButton>
      
      <div className="flex flex-wrap items-center gap-4">
        {/* Conditionally render upload buttons or report button */}
        {!showReportButton ? (
          <>
            <AnimatedButton variant="ghost" onClick={() => onUpload('gastroscopy')} disabled={isLoading} showIcon={false}>
                <Upload className="w-4 h-4 mr-2" /> 打开图像文件
            </AnimatedButton>
            <AnimatedButton variant="ghost" onClick={() => onUpload('pathology')} disabled={isLoading} showIcon={false}>
                <Upload className="w-4 h-4 mr-2" /> 打开病理报告
            </AnimatedButton>
            <AnimatedButton variant="ghost" onClick={() => onUpload('lab')} disabled={isLoading} showIcon={false}>
                <Upload className="w-4 h-4 mr-2" /> 打开血清检查
            </AnimatedButton>

            <div className="w-px h-8 bg-white/20 mx-2"></div>

            <AnimatedButton onClick={onDiagnose} disabled={!canDiagnose || isLoading} showIcon={false}>
              {isLoading && !canDiagnose ? (
                <LoadingSpinner text="诊断中..." size="sm" />
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" /> 诊断结果
                </>
              )}
            </AnimatedButton>
          </>
        ) : (
          <AnimatedButton onClick={onViewReport} showIcon={false}>
            <FileText className="w-4 h-4 mr-2" />
            查看PDF报告
          </AnimatedButton>
        )}

        <AnimatedButton variant="ghost" onClick={onClear} disabled={isLoading} showIcon={false}>
            <Trash2 className="w-4 h-4 mr-2" /> 清空
        </AnimatedButton>
      </div>
    </div>
  );
};

export default ControlButtons;