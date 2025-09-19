// src/components/gastritis/types.ts

export interface GastroscopyImage {
  src: string;
  location: string; // 部位
  lesion: string;   // 病变
}

export interface GastroscopyData {
  images: GastroscopyImage[];
  conclusion: string; // 结论
}

export interface PathologyData {
  diagnosis: string; // 病理诊断
  analysisResult: string; // 分析结果
}

export interface LabData {
  abnormalIndicators: string[]; // 异常指标
  analysisResult: string; // 分析结果
}

export interface DiagnosisResult {
  predictions: { name: string; value: number }[];
  modalWeights: { name: string; value: number }[];
  finalConclusion: string;
}