// packages/shared-types/src/patient.ts
export interface Patient {
  name: string;
  id: string;
  history: string;
  date: string;
  index: string;
  biopsyConfirmed?: boolean;
  doctor?: string;
  createdAt?: Date; // Added by timestamps: true
  updatedAt?: Date; // Added by timestamps: true
}

export interface CreatePatientRequest {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  email?: string;
  phone?: string;
  medicalHistory?: string[];
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {
  id: string;
}