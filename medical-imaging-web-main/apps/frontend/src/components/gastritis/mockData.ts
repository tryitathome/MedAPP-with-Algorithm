// src/components/gastritis/mockData.ts
import { GastroscopyData, PathologyData, LabData, DiagnosisResult } from './types';

export const MOCK_GASTROSCOPY: GastroscopyData = {
  images: [
    { src: '/images/gastritis-fundus.jpg', location: '胃底', lesion: '胃黏膜萎缩' },
    { src: '/images/gastritis-antrum.jpg', location: '胃窦', lesion: '胃黏膜萎缩' },
  ],
  conclusion: '自身免疫性胃炎待排',
};

export const MOCK_PATHOLOGY: PathologyData = {
  diagnosis: '(胃窦后壁)黏膜轻度慢性炎伴轻度肠化。(胃体上部前壁)黏膜轻度慢性炎。',
  analysisResult: '自身免疫性胃炎待排',
};

export const MOCK_LAB: LabData = {
  abnormalIndicators: ['抗内因子抗体: 101.21 / <20.00'],
  analysisResult: '自身免疫性胃炎待排',
};

export const MOCK_DIAGNOSIS_RESULT: DiagnosisResult = {
  predictions: [
    { name: 'AIG', value: 0.891 },
    { name: 'HPAG', value: 0.073 },
    { name: 'Other', value: 0.036 },
  ],
  modalWeights: [
    { name: '内镜图像', value: 0.379 },
    { name: '活检病理报告', value: 0.371 },
    { name: '实验室检验结果', value: 0.249 },
  ],
  finalConclusion: '自身免疫性胃炎',
};