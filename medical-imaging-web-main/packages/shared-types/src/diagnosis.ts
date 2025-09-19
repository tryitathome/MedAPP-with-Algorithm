// @shared/types.ts

export interface DiagnosisResponse {
  confidence: number;
  findings: string[];
  // Optional single finding string for frontend compatibility
  finding?: string;
  recommendation: string;
  severity?: 'low' | 'medium' | 'high';
  // Oral-specific fields
  OLP?: number;
  OLK?: number;
  OOML?: number; // legacy
  OPMD?: number; // new field for real AI output
  // New knowledge field for markdown content
  knowledge?: string;
  // Added detailed report recommendation (third text block)
  reportRecommendation?: string;
  // Internal status code to map 6 branches
  statusCode?:
    | 'OPMD_POSITIVE'
    | 'OPMD_SUSPECTED'
    | 'OPMD_NEGATIVE'
    | 'OLK_POSITIVE'
    | 'OLP_POSITIVE'
    | 'OSF_POSITIVE';
}

export interface DiagnosisResult {
  _id?: string;
  id?: string; // for compatibility
  patientId: string;
  type: 'gastritis' | 'oral';
  imageUrl: string;
  results: DiagnosisResponse;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateDiagnosisRequest {
  patientId: string;
  type?: 'gastritis' | 'oral';
  imageFile?: File;
  imageUrl?: string;
  filename?: string;
}

// Frontend-specific types
export interface DetectionResults {
  OLP: number;
  OLK: number;
  OOML: number;
}

export interface DetectionStatus {
  isDetecting: boolean;
  progress: number;
  stage: string;
  error?: string;
}

export interface OralDiagnosisState {
  selectedImage: string | null;
  isDetecting: boolean;
  detectionComplete: boolean;
  detectionResults: DetectionResults | null;
  currentPatient: number;
  showInstructions: boolean;
  showError: boolean;
  showKnowledge: boolean;
  showReport: boolean;
  reportConfirmed: boolean;
  expandedResults: boolean;
  error: string | null;
}