import express from 'express';
import { DiagnosisController } from '../controllers/diagnosis.controller';

const router = express.Router();
const diagnosisController = new DiagnosisController();

// router.post('/gastritis', diagnosisController.analyzeGastritis);
router.post('/oral', diagnosisController.analyzeOral);
router.post('/oral/deep', diagnosisController.analyzeOralDeep);
// router.get('/:id', diagnosisController.getDiagnosisById);
// router.get('/patient/:patientId', diagnosisController.getDiagnosisByPatient);
// router.delete('/:id', diagnosisController.deleteDiagnosis);

export default router;