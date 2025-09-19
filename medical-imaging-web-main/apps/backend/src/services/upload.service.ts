// src/services/upload.service.ts
import fs from 'fs';
import path from 'path';

export interface ProcessedImageResult {
  filename: string;
  imageUrl: string;
  filePath: string;
  size: number;
}

export class UploadService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads');
    this.ensureUploadsDirectory();
  }

  private ensureUploadsDirectory(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async processImage(file: Express.Multer.File): Promise<ProcessedImageResult> {
    try {
      // For now, we'll just return the original file info
      // In the future, you can add image processing logic here
  // Return a URL that the frontend can fetch directly via backend route
  const imageUrl = `/api/upload/${file.filename}`;
  const filePath = path.join(this.uploadsDir, file.filename);
      
      return {
        filename: file.filename,
        imageUrl: imageUrl,
        filePath: filePath,
        size: file.size
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error('Failed to process image');
    }
  }

  async deleteImage(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadsDir, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Delete image error:', error);
      throw new Error('Failed to delete image');
    }
  }

  async saveBase64Image(base64Data: string): Promise<ProcessedImageResult> {
    try {
      // 解析base64数据
      const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('无效的base64图片格式');
      }

      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const imageBuffer = Buffer.from(matches[2], 'base64');
      
      // 生成文件名
      const filename = `seg_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = path.join(this.uploadsDir, filename);
      
      // 保存文件
      fs.writeFileSync(filePath, imageBuffer);
      
      const imageUrl = `/api/upload/${filename}`;
      
      return {
        filename,
        imageUrl,
        filePath,
        size: imageBuffer.length
      };
    } catch (error) {
      console.error('Save base64 image error:', error);
      throw new Error('Failed to save base64 image');
    }
  }
}

export const uploadService = new UploadService();