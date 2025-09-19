// src/types/oral.ts

export interface DetectionResults {
  OLP: number;
  OLK: number;
  OPMD: number; // 口腔潜在恶性疾病（新）
}

export interface OralDiagnosisRequest {
  patientId: string;
  imageUrl: string;
  filename: string;
}

export interface OralDiagnosisResponse {
  success: boolean;
  data: {
    results: {
      // Detection scores
      OLP: number;
      OLK: number;
  // 优先返回 OPMD，如后端为旧版则可能只有 OOML
  OPMD?: number;
  OOML?: number; // 兼容旧字段
  OSF?: number; // 深度检测专用
  // 基础二分类输出
  predicted_class?: 'Benign' | 'OPMD';
  confidence?: number; // 置信度（对应 predicted_class），另一类由 1 - confidence 得出
      
      // Analysis results
      finding: string;
      recommendation: string;
      knowledge: string; // New field for markdown content
      reportRecommendation?: string; // Detailed report content (第三块文字)
      statusCode?: 'OPMD_POSITIVE' | 'OPMD_SUSPECTED' | 'OPMD_NEGATIVE' | 'OLK_POSITIVE' | 'OLP_POSITIVE' | 'OSF_POSITIVE';
      severity: 'low' | 'medium' | 'high';

      // Deep detection specific fields
      annotatedImage?: string; // Annotated image URL for deep detection
      detections?: Array<{
        class_id: number;
        class_name: string;
        confidence: number;
        box_xyxy: [number, number, number, number];
      }>;
    };
    patientId: string;
    imageUrl: string;
    timestamp: string;
  };
}export interface UploadImageResponse {
  success: boolean;
  imageUrl: string;
  filename: string;
}

export interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  phone: string;
  email: string;
  address: string;
  medicalHistory: string;
  allergies: string;
  medications: string;
  diagnosisHistory: DiagnosisHistoryItem[];
}

export interface DiagnosisHistoryItem {
  id: string;
  date: string;
  diagnosis: string;
  confidence: number;
  imageUrl: string;
  findings: string[];
  recommendation: string;
  knowledge?: string; // New field for markdown content
}

export interface DeepDetectionResults {
  OLP: number;
  OLK: number;
  OSF: number;
  OPMD?: number; // 综合分（最大值）
  annotatedImage?: string;
  detections?: Array<{
    class_id: number;
    class_name: string;
    confidence: number;
    box_xyxy: [number, number, number, number];
  }>;
  // 文本结果（深度检测扩展）
  finding?: string;
  recommendation?: string;
  knowledge?: string;
  reportRecommendation?: string;
  statusCode?: 'OPMD_POSITIVE' | 'OPMD_SUSPECTED' | 'OPMD_NEGATIVE' | 'OLK_POSITIVE' | 'OLP_POSITIVE' | 'OSF_POSITIVE';
}