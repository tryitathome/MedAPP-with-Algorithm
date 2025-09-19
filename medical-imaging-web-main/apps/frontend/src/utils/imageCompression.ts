// utils/imageCompression.ts
export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxSizeKB?: number;
  quality?: number;
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * 压缩图片文件
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns 压缩结果
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1200,
    maxSizeKB = 500,
    quality = 0.8
  } = options;

  return new Promise((resolve, reject) => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const originalSize = file.size;
    const targetSizeBytes = maxSizeKB * 1024;

    // 如果文件已经满足要求，直接返回
    if (originalSize <= targetSizeBytes) {
      const img = new Image();
      img.onload = () => {
        if (img.width <= maxWidth && img.height <= maxHeight) {
          resolve({
            compressedFile: file,
            originalSize,
            compressedSize: originalSize,
            compressionRatio: 1
          });
        } else {
          // 尺寸超过限制，需要压缩
          performCompression();
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    } else {
      // 文件大小超过限制，需要压缩
      performCompression();
    }

    function performCompression() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 计算新的尺寸，保持宽高比
        let { width, height } = calculateNewDimensions(img.width, img.height, maxWidth, maxHeight);
        
        canvas.width = width;
        canvas.height = height;

        // 绘制压缩后的图片
        ctx?.drawImage(img, 0, 0, width, height);

        // 尝试不同的质量级别直到满足大小要求
        let currentQuality = quality;
        let attempts = 0;
        const maxAttempts = 10;

        function tryCompress() {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // 如果压缩后的大小满足要求，或者已经尝试了最大次数
            if (blob.size <= targetSizeBytes || attempts >= maxAttempts || currentQuality <= 0.1) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });

              resolve({
                compressedFile,
                originalSize,
                compressedSize: blob.size,
                compressionRatio: blob.size / originalSize
              });
            } else {
              // 继续降低质量
              attempts++;
              currentQuality = Math.max(0.1, currentQuality - 0.1);
              tryCompress();
            }
          }, file.type, currentQuality);
        }

        tryCompress();
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = URL.createObjectURL(file);
    }
  });
}

/**
 * 计算新的图片尺寸，保持宽高比
 */
function calculateNewDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // 如果宽度超过限制
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  // 如果高度仍然超过限制
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * 批量压缩图片文件
 * @param files 图片文件数组
 * @param options 压缩选项
 * @param onProgress 进度回调
 * @returns 压缩结果数组
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await compressImage(files[i], options);
      results.push(result);
      onProgress?.(i + 1, files.length);
    } catch (error) {
      console.error(`Failed to compress image ${files[i].name}:`, error);
      // 如果压缩失败，使用原文件
      results.push({
        compressedFile: files[i],
        originalSize: files[i].size,
        compressedSize: files[i].size,
        compressionRatio: 1
      });
      onProgress?.(i + 1, files.length);
    }
  }

  return results;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
