export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DiagnosisType = 'gastritis' | 'oral' | 'oral-deep';
export type SeverityLevel = 'low' | 'medium' | 'high';

export type PatientRow = {
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

export type PatientInsert = {
  id?: string;
  patient_id: string;
  name: string;
  history: string;
  date: string;
  index: string;
  biopsy_confirmed?: boolean | null;
  doctor?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type PatientUpdate = {
  patient_id?: string;
  name?: string;
  history?: string;
  date?: string;
  index?: string;
  biopsy_confirmed?: boolean | null;
  doctor?: string | null;
  updated_at?: string;
}

export type DiagnosisRow = {
  id: string;
  patient_id: string;
  type: DiagnosisType;
  image_object_path: string | null;
  confidence: number;
  finding: string;
  findings: Json;
  recommendation: string;
  severity: SeverityLevel | null;
  report_recommendation: string | null;
  status_code: string | null;
  olp_score: number | null;
  olk_score: number | null;
  ooml_score: number | null;
  opmd_score: number | null;
  osf_score: number | null;
  knowledge: string | null;
  annotated_image_object_path: string | null;
  segmentation_image_object_path: string | null;
  detections: Json | null;
  created_at: string;
  updated_at: string;
}

export type DiagnosisInsert = {
  id?: string;
  patient_id: string;
  type: DiagnosisType;
  image_object_path?: string | null;
  confidence: number;
  finding: string;
  findings?: Json;
  recommendation: string;
  severity?: SeverityLevel | null;
  report_recommendation?: string | null;
  status_code?: string | null;
  olp_score?: number | null;
  olk_score?: number | null;
  ooml_score?: number | null;
  opmd_score?: number | null;
  osf_score?: number | null;
  knowledge?: string | null;
  annotated_image_object_path?: string | null;
  segmentation_image_object_path?: string | null;
  detections?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export type DiagnosisUpdate = Partial<DiagnosisInsert>;

export type Database = {
  public: {
    Tables: {
      patients: {
        Row: PatientRow;
        Insert: PatientInsert;
        Update: PatientUpdate;
        Relationships: [];
      };
      diagnoses: {
        Row: DiagnosisRow;
        Insert: DiagnosisInsert;
        Update: DiagnosisUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      diagnosis_type: DiagnosisType;
      severity_level: SeverityLevel;
    };
    CompositeTypes: Record<string, never>;
  };
}
