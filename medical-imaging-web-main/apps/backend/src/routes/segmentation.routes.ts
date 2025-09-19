// backend/src/routes/segmentation.routes.ts
import { Router } from 'express';
import { segmentationController } from '../controllers/segmentation.controller';

const router = Router();

// 执行实例分割
router.post('/', segmentationController.runSegmentation.bind(segmentationController));

// 获取分割结果图片
router.get('/result/:outputDir/vis/:fileName', segmentationController.getResultImage.bind(segmentationController));

// 检查分割环境
router.get('/environment', segmentationController.checkEnvironment.bind(segmentationController));

// 清理旧结果
router.delete('/cleanup', segmentationController.cleanupResults.bind(segmentationController));

export default router;
