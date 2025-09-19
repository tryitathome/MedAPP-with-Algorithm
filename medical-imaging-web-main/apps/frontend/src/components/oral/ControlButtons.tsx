// src/components/oral/ControlButtons.tsx
import React from 'react';
import Link from 'next/link';
import { Upload, Eye, ArrowLeft, FolderOpen } from 'lucide-react';
import { useColors } from '@/config/colors';

interface ControlButtonsProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFolderUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onShowInstructions: () => void;
  interfaceMode?: 'none' | 'single' | 'folder';
  onBackAction?: () => boolean;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({
  onFileUpload,
  onFolderUpload,
  onShowInstructions,
  interfaceMode = 'none',
  onBackAction
}) => {
  const colors = useColors();
  
  const handleBackClick = (e: React.MouseEvent) => {
    if (onBackAction) {
      const shouldNavigate = onBackAction();
      if (!shouldNavigate) {
        e.preventDefault();
        return;
      }
    }
    // 如果没有自定义处理或返回true，则继续默认导航
  };
  
  return (
    <div className="flex justify-between items-center mb-8">
      {/* Left side - Main control buttons */}
      <div className="flex flex-wrap gap-4">
        {/* 选择待检图片文件 - 在folder模式下隐藏 */}
        {interfaceMode !== 'folder' && (
          <label className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 cursor-pointer ${colors.buttonPrimary} ${colors.textLight} border ${colors.borderAccent} ${colors.shadow} flex items-center gap-2`}>
            <Upload className="w-5 h-5" />
            选择待检图片文件
            <input
              type="file"
              accept="image/*"
              onChange={onFileUpload}
              className="hidden"
            />
          </label>
        )}
        
        {/* 添加患者文件夹 - 在single模式下隐藏 */}
        {onFolderUpload && interfaceMode !== 'single' && (
          <label className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 cursor-pointer ${colors.buttonPrimary} ${colors.textLight} border ${colors.borderAccent} ${colors.shadow} flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700`}>
            <FolderOpen className="w-5 h-5" />
            添加患者文件夹
            <input
              type="file"
              {...({ webkitdirectory: "" } as any)}
              onChange={onFolderUpload}
              className="hidden"
            />
          </label>
        )}
        
        <button
          onClick={onShowInstructions}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${colors.buttonGhost} ${colors.textLight} border ${colors.glassBorder} flex items-center gap-2`}
        >
          <Eye className="w-5 h-5" />
          图像导入说明
        </button>
      </div>

      {/* Right side - Return button */}
      {interfaceMode === 'none' ? (
        <Link 
          href="/"
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${colors.buttonGhost} ${colors.textLight} border ${colors.glassBorder} flex items-center gap-2 no-underline`}
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </Link>
      ) : (
        <button
          onClick={handleBackClick}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${colors.buttonGhost} ${colors.textLight} border ${colors.glassBorder} flex items-center gap-2`}
        >
          <ArrowLeft className="w-5 h-5" />
          清空并返回
        </button>
      )}
    </div>
  );
};

export default ControlButtons;