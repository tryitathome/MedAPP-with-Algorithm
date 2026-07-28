import { Patient } from '@shared/types';
import { getDataBackend } from '../config/data-backend';
import { getSupabaseClient } from '../config/supabase';
import { createError } from '../middleware/error.middleware';
import { PatientModel } from '../models/Patient';
import { PatientInsert, PatientRow, PatientUpdate } from '../types/database.types';

export interface PatientRepository {
  list(): Promise<Patient[]>;
  findById(id: string): Promise<Patient | null>;
  create(patient: Patient): Promise<Patient>;
  update(id: string, changes: Partial<Patient>): Promise<Patient | null>;
  delete(id: string): Promise<boolean>;
}

function fromSupabaseRow(row: PatientRow): Patient {
  return {
    id: row.patient_id,
    name: row.name,
    history: row.history,
    date: row.date,
    index: row.index,
    biopsyConfirmed: row.biopsy_confirmed ?? undefined,
    doctor: row.doctor ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

function toSupabaseInsert(patient: Patient): PatientInsert {
  return {
    patient_id: patient.id,
    name: patient.name,
    history: patient.history,
    date: patient.date,
    index: patient.index,
    biopsy_confirmed: patient.biopsyConfirmed ?? null,
    doctor: patient.doctor ?? null
  };
}

class MemoryPatientRepository implements PatientRepository {
  private readonly patients = new Map<string, Patient>();

  async list(): Promise<Patient[]> {
    return Array.from(this.patients.values()).sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    );
  }

  async findById(id: string): Promise<Patient | null> {
    return this.patients.get(id) ?? null;
  }

  async create(patient: Patient): Promise<Patient> {
    this.patients.set(patient.id, patient);
    return patient;
  }

  async update(id: string, changes: Partial<Patient>): Promise<Patient | null> {
    const current = this.patients.get(id);
    if (!current) return null;
    const updated = { ...current, ...changes, id, updatedAt: new Date() };
    this.patients.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.patients.delete(id);
  }
}

class MongoPatientRepository implements PatientRepository {
  async list(): Promise<Patient[]> {
    const rows = await PatientModel.find().sort({ createdAt: -1 });
    return rows.map(row => row.toObject() as unknown as Patient);
  }

  async findById(id: string): Promise<Patient | null> {
    const row = await PatientModel.findOne({ id });
    return row ? row.toObject() as unknown as Patient : null;
  }

  async create(patient: Patient): Promise<Patient> {
    const row = await new PatientModel(patient).save();
    return row.toObject() as unknown as Patient;
  }

  async update(id: string, changes: Partial<Patient>): Promise<Patient | null> {
    const row = await PatientModel.findOneAndUpdate({ id }, changes, { new: true });
    return row ? row.toObject() as unknown as Patient : null;
  }

  async delete(id: string): Promise<boolean> {
    return Boolean(await PatientModel.findOneAndDelete({ id }));
  }
}

class SupabasePatientRepository implements PatientRepository {
  private readonly client = getSupabaseClient();

  async list(): Promise<Patient[]> {
    const { data, error } = await this.client.from('patients').select('*').order('created_at', { ascending: false });
    if (error) throw createError(`Failed to list patients: ${error.message}`, 500);
    return ((data ?? []) as PatientRow[]).map(fromSupabaseRow);
  }

  async findById(id: string): Promise<Patient | null> {
    const { data, error } = await this.client.from('patients').select('*').eq('patient_id', id).maybeSingle();
    if (error) throw createError(`Failed to fetch patient: ${error.message}`, 500);
    return data ? fromSupabaseRow(data as PatientRow) : null;
  }

  async create(patient: Patient): Promise<Patient> {
    const { data, error } = await this.client
      .from('patients')
      .insert(toSupabaseInsert(patient))
      .select('*')
      .single();
    if (error) throw createError(`Failed to create patient: ${error.message}`, 500);
    return fromSupabaseRow(data as PatientRow);
  }

  async update(id: string, changes: Partial<Patient>): Promise<Patient | null> {
    const update: PatientUpdate = {};
    if (changes.name !== undefined) update.name = changes.name;
    if (changes.history !== undefined) update.history = changes.history;
    if (changes.date !== undefined) update.date = changes.date;
    if (changes.index !== undefined) update.index = changes.index;
    if (changes.biopsyConfirmed !== undefined) update.biopsy_confirmed = changes.biopsyConfirmed;
    if (changes.doctor !== undefined) update.doctor = changes.doctor;

    const { data, error } = await this.client
      .from('patients')
      .update(update)
      .eq('patient_id', id)
      .select('*')
      .maybeSingle();
    if (error) throw createError(`Failed to update patient: ${error.message}`, 500);
    return data ? fromSupabaseRow(data as PatientRow) : null;
  }

  async delete(id: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('patients')
      .delete()
      .eq('patient_id', id)
      .select('id')
      .maybeSingle();
    if (error) throw createError(`Failed to delete patient: ${error.message}`, 500);
    return Boolean(data);
  }
}

let memoryRepository: PatientRepository | undefined;

export function createPatientRepository(): PatientRepository {
  switch (getDataBackend()) {
    case 'memory':
      memoryRepository ??= new MemoryPatientRepository();
      return memoryRepository;
    case 'mongodb':
      return new MongoPatientRepository();
    case 'supabase':
      return new SupabasePatientRepository();
  }
}
