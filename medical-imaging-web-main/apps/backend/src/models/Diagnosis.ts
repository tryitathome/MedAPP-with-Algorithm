// src/models/Diagnosis.ts
import mongoose, { Schema } from 'mongoose';
import { DiagnosisResponse, DiagnosisResult } from '@shared/types';

interface PersistedDiagnosisResult extends DiagnosisResult {
  imageObjectPath?: string;
  results: DiagnosisResponse & {
    annotatedImage?: string;
    annotatedImageObjectPath?: string;
    segmentationImage?: string;
    segmentationImageObjectPath?: string;
    detections?: unknown[];
  };
}

const diagnosisSchema = new Schema<PersistedDiagnosisResult>({
  patientId: { type: String, required: true },
  type: { type: String, required: true, enum: ['gastritis', 'oral', 'oral-deep'] },
  imageUrl: { type: String, required: true },
  imageObjectPath: { type: String },
  results: {
    // Common fields
    confidence: { type: Number, required: true, min: 0, max: 1 },
    finding: { type: String, required: true },
    findings: [{ type: String }],
    recommendation: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'] },
    reportRecommendation: { type: String },
    statusCode: { type: String },

    // Oral-specific fields
    OLP: { type: Number, min: 0, max: 1 },
    OLK: { type: Number, min: 0, max: 1 },
    OOML: { type: Number, min: 0, max: 1 },
    OPMD: { type: Number, min: 0, max: 1 },
    OSF: { type: Number, min: 0, max: 1 },

    // New knowledge field for markdown content
    knowledge: { type: String },
    annotatedImage: { type: String },
    annotatedImageObjectPath: { type: String },
    segmentationImage: { type: String },
    segmentationImageObjectPath: { type: String },
    detections: [{ type: Schema.Types.Mixed }]
  }
}, {
  timestamps: true
});

// Index for efficient querying
diagnosisSchema.index({ patientId: 1, createdAt: -1 });
diagnosisSchema.index({ type: 1 });

export const DiagnosisModel = mongoose.model<PersistedDiagnosisResult>('Diagnosis', diagnosisSchema);
