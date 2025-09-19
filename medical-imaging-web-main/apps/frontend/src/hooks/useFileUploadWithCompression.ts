// hooks/useFileUploadWithCompression.ts
import { useCallback, useState } from 'react';
import { useFileUpload } from './useFileUpload';
import { compressImage, compressImages, formatFileSize, type CompressionOptions } from '@/utils/imageCompression';
import { processBatchImport, parsePatientFromFilePath, parsePatientMetadataFile, type PatientFolderInfo } from '@/utils/folderParser';

interface UseFileUploadWithCompressionProps {
  onImageSelect: (image: string | null, file: File | null) => void;
  onDetectionReset: () => void;
  onError: (error: string) => void;
  onBatchImport?: (patients: PatientFolderInfo[]) => void;
  compressionOptions?: CompressionOptions;
  onCompressionStart?: () => void;
  onCompressionProgress?: (current: number, total: number) => void;
  onCompressionComplete?: (results: { originalTotalSize: number; compressedTotalSize: number; fileCount: number }) => void;
}

interface UseFileUploadWithCompressionReturn {
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFolderUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  validateFile: (file: File) => { isValid: boolean; error?: string };
  isCompressing: boolean;
  compressionProgress: { current: number; total: number };
}

export const useFileUploadWithCompression = ({
  onImageSelect,
  onDetectionReset,
  onError,
  onBatchImport,
  compressionOptions = {
    maxWidth: 1600,
    maxHeight: 1200,
    maxSizeKB: 500,
    quality: 0.8
  },
  onCompressionStart,
  onCompressionProgress,
  onCompressionComplete
}: UseFileUploadWithCompressionProps): UseFileUploadWithCompressionReturn => {
  
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState({ current: 0, total: 0 });

  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    const maxSize = 50 * 1024 * 1024; // 增加到50MB，因为我们会压缩
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `文件大小超过限制 (${(maxSize / 1024 / 1024).toFixed(1)}MB)`
      };
    }
    
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `不支持的文件格式。支持的格式: JPEG, PNG, WebP`
      };
    }
    
    return { isValid: true };
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      onImageSelect(null, null);
      return;
    }
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      onError(validation.error || 'Invalid file');
      return;
    }
    
    // Reset previous detection results
    onDetectionReset();
    
    try {
      setIsCompressing(true);
      setCompressionProgress({ current: 0, total: 1 });
      onCompressionStart?.();
      
      // 压缩图片
      const compressionResult = await compressImage(file, compressionOptions);
      
      setCompressionProgress({ current: 1, total: 1 });
      
      // 通知压缩完成
      onCompressionComplete?.({
        originalTotalSize: compressionResult.originalSize,
        compressedTotalSize: compressionResult.compressedSize,
        fileCount: 1
      });
      
      // 尝试从文件路径解析患者信息
      const patientInfo = parsePatientFromFilePath(compressionResult.compressedFile);
      if (patientInfo && onBatchImport) {
        onBatchImport([patientInfo]);
      }
      
      // Create image preview URL
      const imageUrl = URL.createObjectURL(compressionResult.compressedFile);
      
      // Update state with both image URL and compressed file
      onImageSelect(imageUrl, compressionResult.compressedFile);
      
      console.log(`[Compression] 单张图片压缩完成: ${formatFileSize(compressionResult.originalSize)} → ${formatFileSize(compressionResult.compressedSize)} (压缩率: ${(compressionResult.compressionRatio * 100).toFixed(1)}%)`);
      
    } catch (error) {
      console.error('图片压缩失败:', error);
      onError('图片压缩失败，请重试');
    } finally {
      setIsCompressing(false);
      setCompressionProgress({ current: 0, total: 0 });
    }
    
    // Clear input value to allow re-uploading the same file
    event.target.value = '';
  }, [onImageSelect, onDetectionReset, onError, onBatchImport, validateFile, compressionOptions, onCompressionStart, onCompressionComplete]);

  const handleFolderUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (!files || files.length === 0) {
      return;
    }
    
    try {
      onDetectionReset();
      setIsCompressing(true);
      onCompressionStart?.();

      // 先执行原有批量解析（基于文件夹命名）
      const result = await processBatchImport(files);

      // 识别并补充元数据文件
      const metaFileNames = ['metadata.json','patient.json','patient.txt','metadata.txt','patient.meta'];
      const metaGroups: Record<string, { meta: PatientFolderInfo | null; images: File[] }> = {};

      // 预先将已识别患者放入映射，键用 folderPath
      for (const p of result.patients) {
        metaGroups[p.folderPath] = { meta: p, images: p.images };
      }

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const rel = (f as any).webkitRelativePath as string || f.name;
        if (!rel) continue;
        const parts = rel.split('/');
        if (parts.length < 2) continue;
        const folderName = parts[parts.length - 2];
        const fileName = parts[parts.length - 1].toLowerCase();
        
        // 处理元数据文件
        if (metaFileNames.includes(fileName)) {
          console.log(`[FileUpload] 发现元数据文件: ${folderName}/${fileName}`);
          const parsedMeta = await parsePatientMetadataFile(f);
          if (parsedMeta) {
            console.log(`[FileUpload] 成功解析元数据:`, parsedMeta);
            // 如果之前已有该 folder 的解析，合并图片
            if (metaGroups[folderName]) {
              const old = metaGroups[folderName];
              // 保留之前收集的 images
              parsedMeta.images = old.images;
              metaGroups[folderName].meta = parsedMeta;
            } else {
              // 收集该文件夹下的所有图片
              const folderImages: File[] = [];
              for (let j = 0; j < files.length; j++) {
                const imgFile = files[j];
                const imgRel = (imgFile as any).webkitRelativePath || imgFile.name;
                if (imgRel && imgRel.includes('/')) {
                  const imgParts = imgRel.split('/');
                  if (imgParts.length >= 2 && imgParts[imgParts.length - 2] === folderName) {
                    if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(imgFile.type)) {
                      folderImages.push(imgFile);
                    }
                  }
                }
              }
              parsedMeta.images = folderImages;
              metaGroups[folderName] = { meta: parsedMeta, images: folderImages };
            }
          } else {
            console.warn(`[FileUpload] 无法解析元数据文件: ${folderName}/${fileName}`);
          }
        }
      }

      // 重新组装患者数组：优先使用含 meta 的
      const finalPatients: PatientFolderInfo[] = [];
      for (const key of Object.keys(metaGroups)) {
        const g = metaGroups[key];
        if (g.meta) {
          finalPatients.push(g.meta);
        }
      }
      // 如果没有任何 meta 匹配，则回退原结果
      if (finalPatients.length === 0) {
        finalPatients.push(...result.patients);
      }

      // 批量压缩所有患者的所有图片
      let originalTotalSize = 0;
      let compressedTotalSize = 0;
      let totalImageCount = 0;
      let processedCount = 0;

      // 计算总图片数量
      for (const patient of finalPatients) {
        totalImageCount += patient.images.length;
      }

      setCompressionProgress({ current: 0, total: totalImageCount });

      // 逐个患者处理图片压缩
      for (const patient of finalPatients) {
        if (patient.images.length > 0) {
          // 压缩当前患者的所有图片
          const compressionResults = await compressImages(
            patient.images,
            compressionOptions,
            (completed, total) => {
              const currentTotal = processedCount + completed;
              setCompressionProgress({ current: currentTotal, total: totalImageCount });
              onCompressionProgress?.(currentTotal, totalImageCount);
            }
          );

          // 更新患者的图片为压缩后的版本
          patient.images = compressionResults.map(result => result.compressedFile);
          
          // 累计统计
          for (const result of compressionResults) {
            originalTotalSize += result.originalSize;
            compressedTotalSize += result.compressedSize;
          }
          
          processedCount += patient.images.length;
        }
      }

      console.log(`[Compression] 批量压缩完成: ${totalImageCount} 张图片，${formatFileSize(originalTotalSize)} → ${formatFileSize(compressedTotalSize)} (总压缩率: ${(compressedTotalSize / originalTotalSize * 100).toFixed(1)}%)`);
      
      // 通知压缩完成
      onCompressionComplete?.({
        originalTotalSize,
        compressedTotalSize,
        fileCount: totalImageCount
      });

      if (result.errors.length > 0) {
        console.warn('批量导入警告:', result.errors);
        onError(`导入完成，但有 ${result.errors.length} 个警告。请查看控制台了解详情。`);
      }

      if (finalPatients.length === 0) {
        onError('未找到符合格式的患者文件夹或元数据文件。');
        return;
      }

      if (onBatchImport) {
        onBatchImport(finalPatients);
      }

      if (finalPatients.length > 0 && finalPatients[0].images.length > 0) {
        const firstImage = finalPatients[0].images[0];
        const imageUrl = URL.createObjectURL(firstImage);
        onImageSelect(imageUrl, firstImage);
      }

    } catch (error) {
      console.error('批量导入失败:', error);
      onError('批量导入失败，请重试。');
    } finally {
      setIsCompressing(false);
      setCompressionProgress({ current: 0, total: 0 });
    }
    
    // Clear input value
    event.target.value = '';
  }, [onImageSelect, onDetectionReset, onError, onBatchImport, compressionOptions, onCompressionStart, onCompressionProgress, onCompressionComplete]);
  
  return {
    handleFileUpload,
    handleFolderUpload,
    validateFile,
    isCompressing,
    compressionProgress
  };
};
