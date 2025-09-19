// components/oral/EnhancedFileUpload.tsx
'use client'
import React, { useRef } from 'react';
import { Upload, FolderOpen, FileImage } from 'lucide-react';
import { useColors } from '@/config/colors';

interface EnhancedFileUploadProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFolderUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isDisabled?: boolean;
}

const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  onFileUpload,
  onFolderUpload,
  isDisabled = false
}) => {
  const colors = useColors();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFolderButtonClick = () => {
    folderInputRef.current?.click();
  };
  
  return (
    <div className="space-y-4">
      {/* 说明文本 */}
      <div className={`text-sm ${colors.textSecondary} bg-blue-50/10 p-4 rounded-lg border border-blue-200/20`}>
        <h4 className={`font-medium ${colors.textPrimary} mb-2`}>上传方式说明：</h4>
        <div className="space-y-2">
          <p><strong>方式一：</strong> 上传单张图片进行检测（支持 jpg, jpeg, png 格式）</p>
          <p><strong>方式二：</strong> 上传按指定格式排列的图片文件夹</p>
          <div className="mt-2 pl-4 border-l-2 border-blue-300/30">
            <p className="text-xs">文件夹格式：<code className="bg-gray-200/20 px-1 rounded">患者姓名-主病案号-病名-YYMMDD-Y/N</code></p>
            <p className="text-xs">示例：<code className="bg-gray-200/20 px-1 rounded">张三-88888888-口腔扁平苔藓-250101-N</code></p>
            <p className="text-xs text-gray-500">Y=有活检确认，N=无活检确认</p>
          </div>
        </div>
      </div>
      
      {/* 上传按钮组 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 单张图片上传 */}
        <button
          onClick={handleFileButtonClick}
          disabled={isDisabled}
          className={`
            relative overflow-hidden rounded-lg border-2 border-dashed
            ${isDisabled 
              ? 'border-gray-300 bg-gray-100/50 cursor-not-allowed' 
              : 'border-blue-300 bg-blue-50/10 hover:bg-blue-50/20 hover:border-blue-400 cursor-pointer'
            }
            p-6 transition-all duration-300 group
          `}
        >
          <div className="text-center">
            <FileImage 
              className={`mx-auto h-12 w-12 mb-3 ${
                isDisabled ? 'text-gray-400' : 'text-blue-500 group-hover:text-blue-600'
              }`} 
            />
            <p className={`text-sm font-medium ${
              isDisabled ? 'text-gray-500' : colors.textPrimary
            }`}>
              上传单张图片
            </p>
            <p className={`text-xs mt-1 ${
              isDisabled ? 'text-gray-400' : colors.textSecondary
            }`}>
              点击选择图片文件
            </p>
          </div>
        </button>
        
        {/* 文件夹上传 */}
        <button
          onClick={handleFolderButtonClick}
          disabled={isDisabled}
          className={`
            relative overflow-hidden rounded-lg border-2 border-dashed
            ${isDisabled 
              ? 'border-gray-300 bg-gray-100/50 cursor-not-allowed' 
              : 'border-green-300 bg-green-50/10 hover:bg-green-50/20 hover:border-green-400 cursor-pointer'
            }
            p-6 transition-all duration-300 group
          `}
        >
          <div className="text-center">
            <FolderOpen 
              className={`mx-auto h-12 w-12 mb-3 ${
                isDisabled ? 'text-gray-400' : 'text-green-500 group-hover:text-green-600'
              }`} 
            />
            <p className={`text-sm font-medium ${
              isDisabled ? 'text-gray-500' : colors.textPrimary
            }`}>
              批量上传文件夹
            </p>
            <p className={`text-xs mt-1 ${
              isDisabled ? 'text-gray-400' : colors.textSecondary
            }`}>
              点击添加患者文件夹
            </p>
          </div>
        </button>
      </div>
      
      {/* 隐藏的输入元素 */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={onFileUpload}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        disabled={isDisabled}
      />
      
      <input
        ref={folderInputRef}
        type="file"
        onChange={onFolderUpload}
        {...({ webkitdirectory: '' } as any)}
        multiple
        className="hidden"
        disabled={isDisabled}
      />
    </div>
  );
};

export default EnhancedFileUpload;
