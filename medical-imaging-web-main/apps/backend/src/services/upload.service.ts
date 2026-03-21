// src/services/upload.service.ts
import fs from 'fs';
import path from 'path';
import { getSupabase } from '../config/supabase';

const BUCKET_NAME = 'oral_images';

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

  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.webp') return 'image/webp';
    return 'image/jpeg';
  }

  private async uploadToSupabase(filename: string, buffer: Buffer): Promise<string> {
    const supabase = getSupabase();
    const contentType = this.getContentType(filename);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, { contentType, upsert: true });

    if (error) {
      console.error('Supabase storage upload error:', error);
      throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    return urlData.publicUrl;
  }

  async processImage(file: Express.Multer.File): Promise<ProcessedImageResult> {
    try {
      const filePath = path.join(this.uploadsDir, file.filename);

      // Upload to Supabase Storage
      const buffer = fs.readFileSync(filePath);
      const imageUrl = await this.uploadToSupabase(file.filename, buffer);

      return {
        filename: file.filename,
        imageUrl,
        filePath,
        size: file.size
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error('Failed to process image');
    }
  }

  async deleteImage(filename: string): Promise<void> {
    try {
      // Delete from local disk
      const filePath = path.join(this.uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from Supabase Storage
      const supabase = getSupabase();
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filename]);

      if (error) {
        console.warn('Supabase storage delete warning:', error);
      }
    } catch (error) {
      console.error('Delete image error:', error);
      throw new Error('Failed to delete image');
    }
  }

  async saveBase64Image(base64Data: string): Promise<ProcessedImageResult> {
    try {
      const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('无效的base64图片格式');
      }

      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const imageBuffer = Buffer.from(matches[2], 'base64');

      const filename = `seg_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = path.join(this.uploadsDir, filename);

      // Save locally
      fs.writeFileSync(filePath, imageBuffer);

      // Upload to Supabase Storage
      const imageUrl = await this.uploadToSupabase(filename, imageBuffer);

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