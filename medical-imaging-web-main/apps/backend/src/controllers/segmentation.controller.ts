// backend/src/controllers/segmentation.controller.ts
import { Request, Response } from 'express';
import { segmentationService } from '../services/segmentation.service';
import { uploadService } from '../services/upload.service';
import path from 'path';
import fs from 'fs';

export class SegmentationController {
  /**
   * 执行图片实例分割
   */
  async runSegmentation(req: Request, res: Response): Promise<void> {
    try {
      const { image, imageUrl } = req.body;

      if (!image && !imageUrl) {
        res.status(400).json({
          success: false,
          message: '缺少图片数据或URL'
        });
        return;
      }

      let inputImagePath: string;

      if (image) {
        // 处理base64图片数据
        if (!image.startsWith('data:image/')) {
          res.status(400).json({
            success: false,
            message: '无效的图片格式'
          });
          return;
        }

        // 保存上传的图片
        const uploadResult = await uploadService.saveBase64Image(image);
        inputImagePath = uploadResult.filePath;
      } else if (imageUrl) {
        // 处理图片URL（假设已经是服务器上的文件）
        const uploadsDir = path.join(__dirname, '../../uploads');
        const fileName = path.basename(imageUrl);
        inputImagePath = path.join(uploadsDir, fileName);
        
        if (!fs.existsSync(inputImagePath)) {
          res.status(404).json({
            success: false,
            message: '图片文件不存在'
          });
          return;
        }
      } else {
        res.status(400).json({
          success: false,
          message: '无效的请求参数'
        });
        return;
      }

      // 执行分割
      const result = await segmentationService.runSegmentation({
        imagePath: inputImagePath
      });

      res.json({
        success: true,
        data: {
          overlayImageUrl: result.overlayImageUrl,
          inferenceTimeMs: result.inferenceTimeMs,
          modelVersion: result.modelVersion,
          originalImagePath: result.originalImagePath
        }
      });

    } catch (error: any) {
      console.error('[SegmentationController] 分割失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '实例分割失败'
      });
    }
  }

  /**
   * 获取分割结果图片（已废弃 - 现在直接通过 /uploads 静态路由访问）
   */
  async getResultImage(req: Request, res: Response): Promise<void> {
    res.status(410).json({
      success: false,
      message: '此路由已废弃，请直接通过 /uploads 路径访问分割结果图片'
    });
  }

  /**
   * 检查分割环境状态
   */
  async checkEnvironment(req: Request, res: Response): Promise<void> {
    try {
      const isReady = await segmentationService.checkEnvironment();
      
      res.json({
        success: true,
        data: {
          ready: isReady,
          message: isReady ? '分割环境就绪' : '分割环境检查失败'
        }
      });

    } catch (error: any) {
      console.error('[SegmentationController] 环境检查失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '环境检查失败'
      });
    }
  }

  /**
   * 清理旧的分割结果
   */
  async cleanupResults(req: Request, res: Response): Promise<void> {
    try {
      const { hours = 24 } = req.query;
      await segmentationService.cleanupResults(Number(hours));
      
      res.json({
        success: true,
        message: '清理完成'
      });

    } catch (error: any) {
      console.error('[SegmentationController] 清理失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '清理失败'
      });
    }
  }
}

export const segmentationController = new SegmentationController();
