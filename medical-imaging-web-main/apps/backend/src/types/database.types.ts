// Supabase Database Types
// These types match the schema defined in supabase_schema.sql

export type DiagnosisType = 'gastritis' | 'oral';
export type SeverityLevel = 'low' | 'medium' | 'high';

// Detection object (stored as JSONB)
export interface Detection {
  class_name: string;
  confidence: number;
  bbox: number[];
}

// Database row types (what comes from Supabase)
export interface PatientRow {
  id: string;
  patient_id: string;
  name: string;
  history: string;
  date: string;
  index: string;
  biopsy_confirmed: boolean | null;
  doctor: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiagnosisRow {
  id: string;
  patient_id: string;
  type: DiagnosisType;
  image_url: string;
  confidence: number;
  finding: string;
  recommendation: string;
  severity: SeverityLevel | null;
  report_recommendation: string | null;
  status_code: string | null;
  olp_score: number | null;
  olk_score: number | null;
  ooml_score: number | null;
  opmd_score: number | null;
  knowledge: string | null;
  annotated_image_url: string | null;
  detections: Detection[] | null;
  created_at: string;
  updated_at: string;
}

// Insert types (for creating new records)
export interface PatientInsert {
  patient_id: string;
  name: string;
  history: string;
  date: string;
  index: string;
  biopsy_confirmed?: boolean | null;
  doctor?: string | null;
}

export interface DiagnosisInsert {
  patient_id: string;
  type: DiagnosisType;
  image_url: string;
  confidence: number;
  finding: string;
  recommendation: string;
  severity?: SeverityLevel | null;
  report_recommendation?: string | null;
  status_code?: string | null;
  olp_score?: number | null;
  olk_score?: number | null;
  ooml_score?: number | null;
  opmd_score?: number | null;
  knowledge?: string | null;
  annotated_image_url?: string | null;
  detections?: Detection[] | null;
}

// Update types (for updating existing records)
export interface PatientUpdate {
  patient_id?: string;
  name?: string;
  history?: string;
  date?: string;
  index?: string;
  biopsy_confirmed?: boolean | null;
  doctor?: string | null;
}

export interface DiagnosisUpdate {
  patient_id?: string;
  type?: DiagnosisType;
  image_url?: string;
  confidence?: number;
  finding?: string;
  recommendation?: string;
  severity?: SeverityLevel | null;
  report_recommendation?: string | null;
  status_code?: string | null;
  olp_score?: number | null;
  olk_score?: number | null;
  ooml_score?: number | null;
  opmd_score?: number | null;
  knowledge?: string | null;
  annotated_image_url?: string | null;
  detections?: Detection[] | null;
}

// Supabase Database type definition (for typed client)
export type Database = {
  public: {
    Tables: {
      patients: {
        Row: PatientRow;
        Insert: PatientInsert;
        Update: PatientUpdate;
      };
      diagnoses: {
        Row: DiagnosisRow;
        Insert: DiagnosisInsert;
        Update: DiagnosisUpdate;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
