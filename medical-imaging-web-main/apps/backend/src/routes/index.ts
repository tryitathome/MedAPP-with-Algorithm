import express from 'express';
import patientRoutes from './patient.routes';
import diagnosisRoutes from './diagnosis.routes';
import uploadRoutes from './upload.routes';
import segmentationRoutes from './segmentation.routes';

const router = express.Router();

// Mount routes
router.use('/patients', patientRoutes);
router.use('/diagnosis', diagnosisRoutes);
router.use('/upload', uploadRoutes);
router.use('/segmentation', segmentationRoutes);

export default router;
