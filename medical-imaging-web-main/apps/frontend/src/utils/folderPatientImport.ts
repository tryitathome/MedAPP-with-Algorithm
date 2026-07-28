import type { CreatePatientRequest, Patient } from '@shared/types';
import type { PatientFolderInfo } from './folderParser';

export interface ImportedPatientImage {
  file: File;
  patientId: string;
}

export interface ImportedPatientFolder extends Omit<PatientFolderInfo, 'images'> {
  patientId: string;
  images: ImportedPatientImage[];
}

interface PatientResponse {
  success: boolean;
  data: Patient;
}

export interface PatientPersistenceGateway {
  getPatientById(patientId: string): Promise<PatientResponse | null>;
  createPatient(patient: CreatePatientRequest): Promise<PatientResponse>;
}

export function applicationPatientId(patient: PatientFolderInfo): string {
  return `${patient.name}-${patient.caseNumber}-${patient.date}`;
}

async function ensurePatient(
  patient: PatientFolderInfo,
  gateway: PatientPersistenceGateway
): Promise<Patient> {
  const intendedPatientId = applicationPatientId(patient);
  const existing = await gateway.getPatientById(intendedPatientId);
  if (existing) return existing.data;

  const created = await gateway.createPatient({
    patientId: intendedPatientId,
    name: patient.name,
    age: 0,
    gender: 'other',
    medicalHistory: [patient.diagnosis],
    caseNumber: patient.caseNumber,
    diagnosisDate: patient.date,
    biopsyConfirmed: patient.hasBiopsy
  });
  return created.data;
}

export async function ensureFolderPatients(
  patients: PatientFolderInfo[],
  gateway: PatientPersistenceGateway
): Promise<ImportedPatientFolder[]> {
  const ensured = new Map<string, Promise<Patient>>();

  return Promise.all(patients.map(async patient => {
    const intendedPatientId = applicationPatientId(patient);
    let persistedPatient = ensured.get(intendedPatientId);
    if (!persistedPatient) {
      persistedPatient = ensurePatient(patient, gateway);
      ensured.set(intendedPatientId, persistedPatient);
    }

    const stored = await persistedPatient;
    return {
      ...patient,
      patientId: stored.id,
      images: patient.images.map(file => ({ file, patientId: stored.id }))
    };
  }));
}

export function replaceImportedImageFiles(
  images: ImportedPatientImage[],
  replacementFiles: File[]
): ImportedPatientImage[] {
  if (images.length !== replacementFiles.length) {
    throw new Error('Compressed image count does not match imported image count');
  }

  return images.map((image, index) => ({
    file: replacementFiles[index],
    patientId: image.patientId
  }));
}
