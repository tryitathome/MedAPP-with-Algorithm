// apps/backend/src/services/patient.service.ts
import { Patient, CreatePatientRequest, UpdatePatientRequest } from '@shared/types';
import { supabase } from '../config/supabase';
import { PatientRow, PatientInsert, PatientUpdate } from '../types/database.types';
import { createError } from '../middleware/error.middleware';

// In-memory storage for NO_DB mode
let memoryPatients: Map<string, Patient> = new Map();

// Helper: Convert Supabase row to app Patient format
function fromDbFormat(row: PatientRow): Patient {
  return {
    id: row.patient_id,
    name: row.name,
    history: row.history,
    date: row.date,
    index: row.index,
    biopsyConfirmed: row.biopsy_confirmed || undefined,
    doctor: row.doctor || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Helper: Convert app Patient to Supabase insert format
function toDbFormat(patient: Patient): PatientInsert {
  return {
    patient_id: patient.id,
    name: patient.name,
    history: patient.history,
    date: patient.date,
    index: patient.index,
    biopsy_confirmed: patient.biopsyConfirmed || null,
    doctor: patient.doctor || null,
  };
}

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

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row: any) => fromDbFormat(row as PatientRow));
  }

  async getPatientById(id: string): Promise<Patient> {
    if (this.isNoDB()) {
      const patient = memoryPatients.get(id);
      if (!patient) {
        throw createError('Patient not found', 404);
      }
      return patient;
    }

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('patient_id', id)
      .single();

    if (error || !data) {
      throw createError('Patient not found', 404);
    }
    return fromDbFormat(data as PatientRow);
  }

  async createPatient(patientData: CreatePatientRequest): Promise<Patient> {
    const now = Date.now();
    const patient: Patient = {
      id: `patient-${now}`,
      name: patientData.name,
      history: patientData.medicalHistory?.join(', ') || '',
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      index: `${now}`,
      biopsyConfirmed: false,
      doctor: 'Unknown',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (this.isNoDB()) {
      memoryPatients.set(patient.id, patient);
      return patient;
    }

    const { data, error } = await supabase
      .from('patients')
      .insert(toDbFormat(patient) as any)
      .select('*')
      .single();

    if (error) throw error;
    return fromDbFormat(data as PatientRow);
  }

  async updatePatient(updateData: UpdatePatientRequest): Promise<Patient> {
    const { id, ...data } = updateData;

    if (this.isNoDB()) {
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

    const updatePayload: PatientUpdate = {};
    if (data.name) updatePayload.name = data.name;
    if (data.medicalHistory) updatePayload.history = data.medicalHistory.join(', ');

    const { data: updatedData, error } = await supabase
      .from('patients')
      .update(updatePayload as any)
      .eq('patient_id', id)
      .select('*')
      .single();

    if (error || !updatedData) {
      throw createError('Patient not found', 404);
    }
    return fromDbFormat(updatedData as PatientRow);
  }

  async deletePatient(id: string): Promise<void> {
    if (this.isNoDB()) {
      const deleted = memoryPatients.delete(id);
      if (!deleted) {
        throw createError('Patient not found', 404);
      }
      return;
    }

    const { data, error } = await supabase
      .from('patients')
      .delete()
      .eq('patient_id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw createError('Patient not found', 404);
    }
  }
}
