import { Request, Response, NextFunction } from 'express';
import { PatientService } from '../services/patient.service';
import { CreatePatientRequest, UpdatePatientRequest } from '@shared/types';

export class PatientController {
  private patientService: PatientService;

  constructor() {
    this.patientService = new PatientService();
  }

  getAllPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const patients = await this.patientService.getAllPatients();
      res.json({ success: true, data: patients });
    } catch (error) {
      next(error);
    }
  };

  getPatientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const patient = await this.patientService.getPatientById(id);
      res.json({ success: true, data: patient });
    } catch (error) {
      next(error);
    }
  };

  createPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const patientData: CreatePatientRequest = req.body;
      const patient = await this.patientService.createPatient(patientData);
      res.status(201).json({ success: true, data: patient });
    } catch (error) {
      next(error);
    }
  };

  updatePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdatePatientRequest = { ...req.body, id };
      const patient = await this.patientService.updatePatient(updateData);
      res.json({ success: true, data: patient });
    } catch (error) {
      next(error);
    }
  };

  deletePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.patientService.deletePatient(id);
      res.json({ success: true, message: 'Patient deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
