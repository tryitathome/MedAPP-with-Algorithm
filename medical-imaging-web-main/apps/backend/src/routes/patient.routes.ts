import express from 'express';
import { PatientController } from '../controllers/patient.controller';

const router = express.Router();
const patientController = new PatientController();

router.get('/', patientController.getAllPatients);
router.get('/:id', patientController.getPatientById);
router.post('/', patientController.createPatient);
router.put('/:id', patientController.updatePatient);
router.delete('/:id', patientController.deletePatient);

export default router;
