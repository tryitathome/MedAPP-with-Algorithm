import mongoose, { Schema } from 'mongoose';
import { Patient } from '@shared/types';

const patientSchema = new Schema<Patient>({
  name: { type: String, required: true, trim: true },
  id: { type: String, required: true, unique: true },
  history: { type: String, required: true },
  date: { type: String, required: true },
  index: { type: String, required: true },
  biopsyConfirmed: { type: Boolean },
  doctor: { type: String },
}, {
  timestamps: true
});

export const PatientModel = mongoose.model<Patient>('Patient', patientSchema);