// apps/backend/src/services/patient.service.ts
import { Patient, CreatePatientRequest, UpdatePatientRequest } from '@shared/types';
import { createError } from '../middleware/error.middleware';
import { createPatientRepository, PatientRepository } from '../repositories/patient.repository';

export class PatientService {
  private repositoryInstance?: PatientRepository;

  private repository(): PatientRepository {
    this.repositoryInstance ??= createPatientRepository();
    return this.repositoryInstance;
  }

  async getAllPatients(): Promise<Patient[]> {
    return this.repository().list();
  }

  async getPatientById(id: string): Promise<Patient> {
    const patient = await this.repository().findById(id);
    if (!patient) {
      throw createError('Patient not found', 404);
    }
    return patient;
  }

  async createPatient(patientData: CreatePatientRequest): Promise<Patient> {
    const now = Date.now();
    const patient: Patient = {
      id: patientData.patientId ?? `patient-${now}`,
      name: patientData.name,
      history: patientData.medicalHistory?.join(', ') ?? '',
      date: patientData.diagnosisDate ?? new Date().toISOString().split('T')[0],
      index: patientData.caseNumber ?? `${now}`,
      biopsyConfirmed: patientData.biopsyConfirmed ?? false,
      doctor: patientData.doctor ?? 'Unknown',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return this.repository().create(patient);
  }

  async updatePatient(updateData: UpdatePatientRequest): Promise<Patient> {
    const { id, ...data } = updateData;
    const changes: Partial<Patient> = {};
    if (data.name !== undefined) changes.name = data.name;
    if (data.medicalHistory !== undefined) changes.history = data.medicalHistory.join(', ');
    const patient = await this.repository().update(id, changes);
    if (!patient) {
      throw createError('Patient not found', 404);
    }
    return patient;
  }

  async deletePatient(id: string): Promise<void> {
    if (!await this.repository().delete(id)) {
      throw createError('Patient not found', 404);
    }
  }
}
