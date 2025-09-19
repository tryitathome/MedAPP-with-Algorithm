// backend/src/services/segmentation.service.ts
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SegmentationRequest {
  imagePath: string; // 输入图片的绝对路径
  outputDir?: string; // 可选的输出目录
}

export interface SegmentationResult {
  overlayImagePath: string; // 生成的叠加图片路径
  overlayImageUrl: string;  // 可访问的URL路径
  inferenceTimeMs: number;
  modelVersion: string;
  originalImagePath: string;
}

export class SegmentationService {
  private readonly pythonPath = 'C:\\Users\\tryitathome\\.conda\\envs\\MMDETECTION\\python.exe';
  private readonly mmdetectionDir = 'D:\\MyWorkSpace\\MedAPP\\MMDETECTION_mini';
  private readonly scriptPath = 'D:\\MyWorkSpace\\MedAPP\\MMDETECTION_mini\\image_demo.py';
  private readonly configPath = 'D:\\MyWorkSpace\\MedAPP\\MMDETECTION_mini\\eval_ZJY_1102_mask2\\mask2former_swin_s.py';
  private readonly weightsPath = 'D:\\MyWorkSpace\\MedAPP\\MMDETECTION_mini\\eval_ZJY_1102_mask2\\Swing-S-75000-best-data.pth';
  private readonly defaultOutputDir = 'eval_results';
  private readonly uploadsDir = path.join(__dirname, '../../uploads'); // 后端 uploads 目录

  /**
   * 运行实例分割算法
   */
  async runSegmentation(request: SegmentationRequest): Promise<SegmentationResult> {
    const startTime = Date.now();
    
    try {
      // 验证输入图片是否存在
      if (!fs.existsSync(request.imagePath)) {
        throw new Error(`输入图片不存在: ${request.imagePath}`);
      }

      // 提取图片文件名
      const imageFileName = path.basename(request.imagePath);
      const outputDir = request.outputDir || this.defaultOutputDir;

      // 构建命令
      const command = [
        `"${this.pythonPath}"`,
        `"${this.scriptPath}"`,
        `"${request.imagePath}"`,
        `"${this.configPath}"`,
        '--weights',
        `"${this.weightsPath}"`,
        '--out-dir',
        outputDir
      ].join(' ');

      console.log(`[SegmentationService] 执行命令: ${command}`);
      console.log(`[SegmentationService] 工作目录: ${this.mmdetectionDir}`);

      // 切换到 MMDETECTION_mini 目录执行命令
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.mmdetectionDir,
        timeout: 120000 // 2分钟超时
      });

      if (stderr && !stderr.includes('UserWarning')) {
        console.warn(`[SegmentationService] 警告输出: ${stderr}`);
      }

      console.log(`[SegmentationService] 标准输出: ${stdout}`);

      // 计算推理时间
      const inferenceTimeMs = Date.now() - startTime;

      // 构建预期的输出图片路径（算法生成的位置）
      const tempOverlayImagePath = path.join(this.mmdetectionDir, outputDir, 'vis', imageFileName);
      
      // 验证输出图片是否生成
      if (!fs.existsSync(tempOverlayImagePath)) {
        throw new Error(`分割结果图片未生成: ${tempOverlayImagePath}`);
      }

      // 生成目标文件名（使用时间戳避免冲突）
      const timestamp = Date.now();
      const ext = path.extname(imageFileName);
      const baseName = path.basename(imageFileName, ext);
      const finalFileName = `segmented_${timestamp}_${baseName}${ext}`;
      
      // 确保 uploads 目录存在
      if (!fs.existsSync(this.uploadsDir)) {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      }
      
      // 将生成的图片复制到 uploads 目录
      const finalImagePath = path.join(this.uploadsDir, finalFileName);
      fs.copyFileSync(tempOverlayImagePath, finalImagePath);
      
      console.log(`[SegmentationService] 图片已复制: ${tempOverlayImagePath} -> ${finalImagePath}`);

      // 构建可访问的URL（通过后端静态文件服务）
      const overlayImageUrl = `/uploads/${finalFileName}`;

      const result: SegmentationResult = {
        overlayImagePath: finalImagePath, // 更新为最终位置
        overlayImageUrl,
        inferenceTimeMs,
        modelVersion: 'mask2former_swin_s_v1.0',
        originalImagePath: request.imagePath
      };

      console.log(`[SegmentationService] 分割完成:`, result);
      return result;

    } catch (error: any) {
      console.error(`[SegmentationService] 分割失败:`, error);
      throw new Error(`实例分割失败: ${error.message}`);
    }
  }

  /**
   * 检查分割环境是否可用
   */
  async checkEnvironment(): Promise<boolean> {
    try {
      // 检查Python环境
      if (!fs.existsSync(this.pythonPath)) {
        console.error(`Python环境不存在: ${this.pythonPath}`);
        return false;
      }

      // 检查脚本文件
      if (!fs.existsSync(this.scriptPath)) {
        console.error(`脚本文件不存在: ${this.scriptPath}`);
        return false;
      }

      // 检查配置文件
      if (!fs.existsSync(this.configPath)) {
        console.error(`配置文件不存在: ${this.configPath}`);
        return false;
      }

      // 检查模型权重文件
      if (!fs.existsSync(this.weightsPath)) {
        console.error(`模型权重文件不存在: ${this.weightsPath}`);
        return false;
      }

      // 检查MMDETECTION目录
      if (!fs.existsSync(this.mmdetectionDir)) {
        console.error(`MMDETECTION目录不存在: ${this.mmdetectionDir}`);
        return false;
      }

      console.log('[SegmentationService] 环境检查通过');
      return true;

    } catch (error) {
      console.error(`[SegmentationService] 环境检查失败:`, error);
      return false;
    }
  }

  /**
   * 清理旧的分割结果
   */
  async cleanupResults(olderThanHours: number = 24): Promise<void> {
    try {
      // 清理临时输出目录
      const tempResultsDir = path.join(this.mmdetectionDir, this.defaultOutputDir, 'vis');
      if (fs.existsSync(tempResultsDir)) {
        const tempFiles = fs.readdirSync(tempResultsDir);
        const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);

        for (const file of tempFiles) {
          const filePath = path.join(tempResultsDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            fs.unlinkSync(filePath);
            console.log(`[SegmentationService] 清理临时文件: ${file}`);
          }
        }
      }

      // 清理 uploads 目录中的分割结果文件
      if (fs.existsSync(this.uploadsDir)) {
        const uploadFiles = fs.readdirSync(this.uploadsDir);
        const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);

        for (const file of uploadFiles) {
          // 只清理分割生成的文件（以 segmented_ 开头）
          if (file.startsWith('segmented_')) {
            const filePath = path.join(this.uploadsDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.mtime.getTime() < cutoffTime) {
              fs.unlinkSync(filePath);
              console.log(`[SegmentationService] 清理分割结果文件: ${file}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('[SegmentationService] 清理结果失败:', error);
    }
  }
}

export const segmentationService = new SegmentationService();
