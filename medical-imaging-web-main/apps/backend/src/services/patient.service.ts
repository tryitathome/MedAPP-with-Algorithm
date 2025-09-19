// apps/backend/src/services/patient.service.ts
import { Patient, CreatePatientRequest, UpdatePatientRequest } from '@shared/types';
import { PatientModel } from '../models/Patient';
import { createError } from '../middleware/error.middleware';

// In-memory storage for NO_DB mode
let memoryPatients: Map<string, Patient> = new Map();

export class PatientService {
  private isNoDB(): boolean {
    return process.env.NO_DB === 'true';
  }

  async getAllPatients(): Promise<Patient[]> {
    if (this.isNoDB()) {
      return Array.from(memoryPatients.values()).sort((a, b) => 
        new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime()
      );
    }
    const patients = await PatientModel.find().sort({ createdAt: -1 });
    return patients.map(patient => patient.toObject());
  }

  async getPatientById(id: string): Promise<Patient> {
    if (this.isNoDB()) {
      const patient = memoryPatients.get(id);
      if (!patient) {
        throw createError('Patient not found', 404);
      }
      return patient;
    }
    const patient = await PatientModel.findOne({ id });
    if (!patient) {
      throw createError('Patient not found', 404);
    }
    return patient.toObject();
  }

  async createPatient(patientData: CreatePatientRequest): Promise<Patient> {
    if (this.isNoDB()) {
      // Convert CreatePatientRequest to Patient format
      const patient: Patient = {
        id: `patient-${Date.now()}`,
        name: patientData.name,
        history: patientData.medicalHistory?.join(', ') || '',
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        index: `${Date.now()}`,
        biopsyConfirmed: false,
        doctor: 'Unknown',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryPatients.set(patient.id, patient);
      return patient;
    }
    // 数据库模式：PatientModel schema 需要 id / history / date / index
    const now = Date.now();
    const dbPatient: Patient = {
      id: `patient-${now}`,
      name: patientData.name,
      history: patientData.medicalHistory?.join(', ') || '',
      date: new Date().toISOString().split('T')[0],
      index: `${now}`,
      biopsyConfirmed: false,
      doctor: 'Unknown'
    };
    const patient = new PatientModel(dbPatient);
    const savedPatient = await patient.save();
    return savedPatient.toObject();
  }

  async updatePatient(updateData: UpdatePatientRequest): Promise<Patient> {
    if (this.isNoDB()) {
      const { id, ...data } = updateData;
      const existingPatient = memoryPatients.get(id);
      if (!existingPatient) {
        throw createError('Patient not found', 404);
      }
      const updatedPatient: Patient = {
        ...existingPatient,
        name: data.name || existingPatient.name,
        history: data.medicalHistory?.join(', ') || existingPatient.history,
        updatedAt: new Date()
      };
      memoryPatients.set(id, updatedPatient);
      return updatedPatient;
    }
    const { id, ...data } = updateData;
    const patient = await PatientModel.findByIdAndUpdate(id, data, { new: true });
    if (!patient) {
      throw createError('Patient not found', 404);
    }
    return patient.toObject();
  }

  async deletePatient(id: string): Promise<void> {
    if (this.isNoDB()) {
      const deleted = memoryPatients.delete(id);
      if (!deleted) {
        throw createError('Patient not found', 404);
      }
      return;
    }
    const patient = await PatientModel.findByIdAndDelete(id);
    if (!patient) {
      throw createError('Patient not found', 404);
    }
  }
}