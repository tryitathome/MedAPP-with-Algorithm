// hooks/useOralDiagnosis.ts
import { useState, useCallback } from 'react';
import { DetectionResults } from '@/types/oral';
import { oralDiagnosisService } from '@/services/api/diagnosisService';
import { OralDiagnosisResponse } from '@/types/oral';
import { usePatientManagement } from '@/hooks/usePatientManagement';
import { parseFolderName } from '@/utils/folderParser';
import { patientService } from '@/services/api/patientService';

interface UseOralDiagnosisReturn {
  // Diagnosis state
  selectedImage: string | null;
  selectedFile: File | null;
  isDetecting: boolean;
  detectionComplete: boolean;
  detectionResults: DetectionResults | null;
  diagnosisResponse: OralDiagnosisResponse | null;
  
  // Modal state
  showInstructions: boolean;
  showError: boolean;
  showKnowledge: boolean;
  showReport: boolean;
  error: string | null;
  
  // Patient management (from usePatientManagement)
  patientManagement: ReturnType<typeof usePatientManagement>;
  
  // Diagnosis actions
  setSelectedImage: (image: string | null) => void;
  setSelectedFile: (file: File | null) => void;
  setIsDetecting: (detecting: boolean) => void;
  setDetectionComplete: (complete: boolean) => void;
  setDetectionResults: (results: DetectionResults | null) => void;
  setDiagnosisResponse: (response: OralDiagnosisResponse | null) => void;
  
  // Modal actions
  setShowInstructions: (show: boolean) => void;
  setShowError: (show: boolean) => void;
  setShowKnowledge: (show: boolean) => void;
  setShowReport: (show: boolean) => void;
  setError: (error: string | null) => void;
  
  // Deep detection actions
  setDeepMode: (mode: boolean) => void;
  
  // Diagnosis handlers
  handleImageSelect: (image: string | null, file: File | null) => void;
  handleDetectionStart: () => Promise<void>;
  handleDetectionComplete: (results: DetectionResults, response: OralDiagnosisResponse) => void;
  handleReset: () => void;
  handleStartDeepDetection: () => Promise<void>;
  
  // Computed values
  buttonsEnabled: boolean;
  canStartDetection: boolean;
  canShowDeepButton: boolean;
  deepMode: boolean;
  deepDetectionResults: any | null;
  isDeepLoading: boolean;
}

export const useOralDiagnosis = (): UseOralDiagnosisReturn => {
  // Diagnosis state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionComplete, setDetectionComplete] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectionResults | null>(null);
  const [diagnosisResponse, setDiagnosisResponse] = useState<OralDiagnosisResponse | null>(null);
  
  // Modal state
  const [showInstructions, setShowInstructions] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Deep detection state
  const [deepMode, setDeepMode] = useState(false);
  const [deepDetectionResults, setDeepDetectionResults] = useState<any | null>(null);
  const [isDeepLoading, setIsDeepLoading] = useState(false);
  const [basicOPMDCache, setBasicOPMDCache] = useState<number>(0); // 缓存基础阶段 OPMD
  const DEEP_THRESHOLD = 0.6; // OPMD >= 0.6 才显示深度检测按钮
  
  // Patient management hook
  const patientManagement = usePatientManagement();
  
  // Handlers
  const handleImageSelect = useCallback((image: string | null, file: File | null) => {
    setSelectedImage(image);
    setSelectedFile(file);
    setDetectionComplete(false);
    setDetectionResults(null);
    setDiagnosisResponse(null);
    setError(null);
    // 重置深度检测相关状态
    setDeepMode(false);
    setDeepDetectionResults(null);
    setIsDeepLoading(false);

    // 不再自动添加虚拟患者，避免干扰批量患者管理的同步
    // patientManagement.addDummyPatient();
  }, []);
  
  const handleDetectionStart = useCallback(async () => {
    if (!selectedFile) {
      setError('No file selected');
      setShowError(true);
      return;
    }

    try {
      setIsDetecting(true);
      setDetectionComplete(false);
      setDetectionResults(null);
      setDiagnosisResponse(null);
      setError(null);
      // 1. 推断/创建患者 ID
      let patientId: string | null = null;
      let parsed = null as ReturnType<typeof parseFolderName> | null;

      // (a) 尝试从 File 对象的 webkitRelativePath 或名称解析父文件夹
      const relPath = (selectedFile as any).webkitRelativePath as string | undefined;
      if (relPath) {
        const parts = relPath.split('/');
        if (parts.length >= 2) {
          const folderName = parts[parts.length - 2];
          parsed = parseFolderName(folderName);
        }
      }
      // (b) 如果拖拽/单文件上传无法得到 webkitRelativePath，可提示用户或后续扩展
      if (!parsed) {
        console.log('[OralDiagnosis] 未能从文件路径解析患者信息，将使用默认占位患者');
      }

      // (c) 如果已经有当前患者且不是 N/A，并且未解析到新的信息，复用现有 id
      if (!parsed && patientManagement.currentPatientData.id !== 'N/A') {
        patientId = patientManagement.currentPatientData.id;
      } else if (!parsed) {
        // 只有在没有任何患者信息且无法解析时，才添加虚拟患者
        patientManagement.addDummyPatient();
      }

      // (d) 如果解析成功，尝试根据唯一键(姓名+案号+日期)生成稳定 id（避免重复创建）
      if (parsed) {
        // 组合一个 deterministic ID
        const stableKey = `${parsed.name}-${parsed.caseNumber}-${parsed.date}`;
        patientId = stableKey; // 直接作为 id 使用（后端 getPatientById 会 404 如未创建）
        try {
          await patientManagement.addPatientById(patientId); // 若存在则加载
        } catch (e) {
          // 不存在则创建
          console.log('[OralDiagnosis] patient not found, creating new:', patientId);
          try {
            const created = await patientService.createPatient({
              name: parsed.name,
              age: 0, // 未知占位
              gender: 'other',
              medicalHistory: [parsed.diagnosis]
            });
            // 后端生成的 id (可能是 patient- 时间戳 )
            patientId = created.data.id;
            // 重新加入管理
            await patientManagement.addPatientById(patientId);
          } catch (ce) {
            console.error('[OralDiagnosis] 创建患者失败，回退到占位 ID', ce);
          }
        }
      }

      if (!patientId) {
        // 最后兜底：创建一个占位患者（只创建一次）
        try {
          const created = await patientService.createPatient({
            name: '隐私检测模式-匿名患者',
            age: 0,
            gender: 'other',
            medicalHistory: []
          });
            patientId = created.data.id;
            await patientManagement.addPatientById(patientId);
        } catch (e) {
          console.warn('[OralDiagnosis] 创建占位患者失败，使用 patient-0 继续（可能导致 404）');
          patientId = 'patient-0';
        }
      }

      // 2. 调用诊断接口
      const diagnosisResponse = await oralDiagnosisService.analyzeOralImage(patientId!, selectedFile);

      // Convert API response to DetectionResults format
      const detectionResults: DetectionResults = {
        OLP: diagnosisResponse.data.results.OLP,
        OLK: diagnosisResponse.data.results.OLK,
        // Use OPMD primarily; fallback to OOML for backward compatibility
        OPMD: diagnosisResponse.data.results.OPMD ?? diagnosisResponse.data.results.OOML ?? 0
      };
      
      // Update state with results
      setDetectionResults(detectionResults);
      setDiagnosisResponse(diagnosisResponse);
      setDetectionComplete(true);
      setIsDetecting(false);
      setBasicOPMDCache(detectionResults.OPMD); // 缓存基础阶段 OPMD
      
    } catch (error) {
      console.error('Detection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      setIsDetecting(false);
      setDetectionComplete(false);
      setShowError(true);
    }
  }, [selectedFile, patientManagement]);
  
  const handleDetectionComplete = useCallback((results: DetectionResults, response: OralDiagnosisResponse) => {
    setIsDetecting(false);
    setDetectionComplete(true);
    setDetectionResults(results);
    setDiagnosisResponse(response);
    setError(null);
  }, []);
  
  const handleReset = useCallback(() => {
    setSelectedImage(null);
    setSelectedFile(null);
    setIsDetecting(false);
    setDetectionComplete(false);
    setDetectionResults(null);
    setDiagnosisResponse(null);
    setError(null);
    setShowError(false);
    setShowInstructions(false);
    setShowKnowledge(false);
    setShowReport(false);
  }, []);
  
  const handleStartDeepDetection = useCallback(async () => {
    if (!selectedFile || !diagnosisResponse) return;
    try {
      setIsDeepLoading(true);
      const patientId = diagnosisResponse.data.patientId || 'patient-0';
      
      // 使用新的深度检测 API 方法
      const deepDiagnosisResponse = await oralDiagnosisService.analyzeOralImageDeep({
        patientId,
        imageUrl: diagnosisResponse.data.imageUrl,
        filename: diagnosisResponse.data.imageUrl.split('/').pop() || ''
      });

      // 提取深度检测结果
      const resData = deepDiagnosisResponse.data.results;
      const basicOPMD = basicOPMDCache || detectionResults?.OPMD || 0;
      const deepRes = {
        OLP: resData.OLP || 0,
        OLK: resData.OLK || 0,
        OSF: resData.OSF || 0,
        // OPMD 固定使用基础阶段缓存值（医学含义保持一致）
        OPMD: basicOPMD,
        annotatedImage: resData.annotatedImage,
        detections: resData.detections,
        // 添加深度检测的文本结果
        finding: resData.finding,
        recommendation: resData.recommendation,
        knowledge: resData.knowledge,
        reportRecommendation: resData.reportRecommendation,
        statusCode: resData.statusCode
      };
      setDeepDetectionResults(deepRes);
      setDeepMode(true);
    } catch (e) {
      console.error('Deep detection error', e);
      setError(e instanceof Error ? e.message : 'Deep detection error');
      setShowError(true);
    } finally {
      setIsDeepLoading(false);
    }
  }, [selectedFile, diagnosisResponse]);
  
  // Computed values
  const buttonsEnabled = Boolean(selectedImage && detectionComplete && !isDetecting);
  const canStartDetection = Boolean(selectedImage && selectedFile && !isDetecting && !detectionComplete);
  const canShowDeepButton = !!(detectionResults && detectionResults.OPMD >= DEEP_THRESHOLD && !deepMode);
  
  return {
    // Diagnosis state
    selectedImage,
    selectedFile,
    isDetecting,
    detectionComplete,
    detectionResults,
    diagnosisResponse,
    
    // Modal state
    showInstructions,
    showError,
    showKnowledge,
    showReport,
    error,
    
    // Patient management
    patientManagement,
    
    // Diagnosis actions
    setSelectedImage,
    setSelectedFile,
    setIsDetecting,
    setDetectionComplete,
    setDetectionResults,
    setDiagnosisResponse,
    
    // Modal actions
    setShowInstructions,
    setShowError,
    setShowKnowledge,
    setShowReport,
    setError,
    
    // Deep detection actions
    setDeepMode,
    
    // Diagnosis handlers
    handleImageSelect,
    handleDetectionStart,
    handleDetectionComplete,
    handleReset,
    handleStartDeepDetection,
    
    // Computed values
    buttonsEnabled,
    canStartDetection,
  canShowDeepButton,
  deepMode,
  deepDetectionResults,
  isDeepLoading
  };
};