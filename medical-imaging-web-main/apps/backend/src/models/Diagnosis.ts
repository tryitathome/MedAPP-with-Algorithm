// src/models/Diagnosis.ts
import mongoose, { Schema } from 'mongoose';
import { DiagnosisResult } from '@shared/types';

const diagnosisSchema = new Schema<DiagnosisResult>({
  patientId: { type: String, required: true },
  type: { type: String, required: true, enum: ['gastritis', 'oral'] },
  imageUrl: { type: String, required: true },
  results: {
    // Common fields
    confidence: { type: Number, required: true, min: 0, max: 1 },
    finding: { type: String, required: true },
    recommendation: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'] },
  reportRecommendation: { type: String },
  statusCode: { type: String },
    
    // Oral-specific fields
    OLP: { type: Number, min: 0, max: 1 },
    OLK: { type: Number, min: 0, max: 1 },
    OOML: { type: Number, min: 0, max: 1 },
    
    // New knowledge field for markdown content
    knowledge: { type: String }
  }
}, {
  timestamps: true
});

// Index for efficient querying
diagnosisSchema.index({ patientId: 1, createdAt: -1 });
diagnosisSchema.index({ type: 1 });

export const DiagnosisModel = mongoose.model<DiagnosisResult>('Diagnosis', diagnosisSchema);