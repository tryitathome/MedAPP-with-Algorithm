// src/components/oral/ImageUploadArea.tsx
import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useColors } from '@/config/colors';

interface ImageUploadAreaProps {
  selectedImage: string | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ImageUploadArea: React.FC<ImageUploadAreaProps> = ({
  selectedImage,
  onFileUpload
}) => {
  const colors = useColors();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Handle click to open file dialog
  const handleClick = () => {
    if (!selectedImage) {
      fileInputRef.current?.click();
    }
  };
  
  // Handle drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check if file is an image
      if (file.type.startsWith('image/')) {
        // Create a synthetic event object to match the expected type
        const syntheticEvent = {
          target: {
            files: files
          }
        } as React.ChangeEvent<HTMLInputElement>;
        
        onFileUpload(syntheticEvent);
      }
    }
  };
  
  return (
    <div className="space-y-4">
      <div 
        className={`aspect-square border-2 border-dashed rounded-xl flex items-center justify-center bg-white/5 min-h-[400px] transition-all duration-300 ${
          isDragOver 
            ? 'border-blue-400 bg-blue-500/10 scale-105' 
            : selectedImage 
              ? 'border-white/30' 
              : 'border-white/30 hover:border-white/50 cursor-pointer hover:bg-white/10'
        }`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {selectedImage ? (
          <img
            src={selectedImage}
            alt="Selected"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        ) : (
          <div className="text-center pointer-events-none">
            <Upload className={`w-16 h-16 mx-auto mb-4 transition-colors ${
              isDragOver ? 'text-blue-400' : 'text-gray-400'
            }`} />
            <p className={`${colors.textSecondary} text-lg mb-2`}>
              {isDragOver ? '释放文件以上传' : '点击选择图片文件'}
            </p>
            <p className={`${colors.textSecondary} text-sm opacity-70`}>
              或将图片拖拽到此处
            </p>
          </div>
        )}
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default ImageUploadArea;