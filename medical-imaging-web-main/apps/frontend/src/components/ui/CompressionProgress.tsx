// components/ui/CompressionProgress.tsx
import React from 'react';
import { useColors } from '@/config/colors';
import { formatFileSize } from '@/utils/imageCompression';

interface CompressionProgressProps {
  isVisible: boolean;
  current: number;
  total: number;
  stats?: {
    originalTotalSize: number;
    compressedTotalSize: number;
    fileCount: number;
  } | null;
  onStatsClose?: () => void;
}

interface CompressionStatsProps {
  stats: {
    originalTotalSize: number;
    compressedTotalSize: number;
    fileCount: number;
  };
  onClose?: () => void;
}

const CompressionStats: React.FC<CompressionStatsProps> = ({ stats, onClose }) => {
  const colors = useColors();
  const compressionRatio = ((1 - stats.compressedTotalSize / stats.originalTotalSize) * 100);
  
  return (
    <div className="bg-green-50/10 border border-green-200/30 rounded-lg p-4 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-green-400 hover:text-green-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      <div className="flex items-center mb-3">
        <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className={`text-sm font-medium ${colors.textPrimary}`}>
          图片压缩完成
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-green-400">处理图片:</span>
          <span className="text-xs font-medium text-green-300">{stats.fileCount} 张</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-green-400">原始大小:</span>
          <span className="text-xs font-medium text-green-300">{formatFileSize(stats.originalTotalSize)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-green-400">压缩后:</span>
          <span className="text-xs font-medium text-green-300">{formatFileSize(stats.compressedTotalSize)}</span>
        </div>
        
        <div className="flex justify-between items-center pt-1 border-t border-green-200/20">
          <span className="text-xs text-green-400">压缩率:</span>
          <span className="text-xs font-bold text-green-200">{compressionRatio.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

const CompressionProgress: React.FC<CompressionProgressProps> = ({ 
  isVisible, 
  current, 
  total, 
  stats, 
  onStatsClose 
}) => {
  const colors = useColors();
  
  if (!isVisible && !stats) return null;
  
  return (
    <div className="space-y-3">
      {/* 压缩进度显示 */}
      {isVisible && (
        <div className="bg-blue-50/10 border border-blue-200/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
              <span className={`text-sm font-medium ${colors.textPrimary}`}>
                正在压缩图片...
              </span>
            </div>
            <span className="text-xs text-blue-400 font-mono">
              {current} / {total}
            </span>
          </div>
          
          <div className="w-full bg-gray-200/20 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${total > 0 ? (current / total * 100) : 0}%` 
              }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-blue-300">
              {total > 1 ? '批量处理中' : '单张处理中'}
            </span>
            <span className="text-xs text-blue-300">
              {total > 0 ? Math.round(current / total * 100) : 0}%
            </span>
          </div>
        </div>
      )}
      
      {/* 压缩统计显示 */}
      {stats && (
        <CompressionStats stats={stats} onClose={onStatsClose} />
      )}
    </div>
  );
};

export default CompressionProgress;
