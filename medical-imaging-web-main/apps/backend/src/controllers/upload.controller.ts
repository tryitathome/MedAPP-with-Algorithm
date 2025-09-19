// src/controllers/upload.controller.ts
import { Request, Response } from 'express';
import { UploadService } from '../services/upload.service';
import path from 'path';
import fs from 'fs';

export class UploadController {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  uploadImage = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      const result = await this.uploadService.processImage(req.file);
      
      res.status(200).json({
        success: true,
        imageUrl: result.imageUrl,
        filename: result.filename,
        originalName: req.file.originalname,
        size: result.size,
        message: 'Image uploaded successfully'
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload image'
      });
    }
  };

  deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        res.status(400).json({
          success: false,
          message: 'Filename is required'
        });
        return;
      }

      await this.uploadService.deleteImage(filename);
      
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete image'
      });
    }
  };

  getImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { filename } = req.params;
      const uploadsDir = path.join(__dirname, '../../uploads');
      const filePath = path.join(uploadsDir, filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          success: false,
          message: 'File not found'
        });
        return;
      }

      // Set appropriate headers
      const ext = path.extname(filename).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : 
                         ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                         ext === '.webp' ? 'image/webp' : 'image/jpeg';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
      
      // Send file
      res.sendFile(filePath);
    } catch (error) {
      console.error('Get image error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to serve image'
      });
    }
  };
}