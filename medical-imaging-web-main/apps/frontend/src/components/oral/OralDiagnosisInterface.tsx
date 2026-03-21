// src/components/oral/OralDiagnosisInterface.tsx
'use client'
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Download, BookOpen, ArrowLeft, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useColors } from '@/config/colors';

// Component imports
import GlassCard from '@/components/ui/GlassCard';
import CompressionProgress from '@/components/ui/CompressionProgress';

// Modal imports
import InstructionsModal from '@/components/oral/modals/InstructionsModal';
import ErrorModal from '@/components/oral/modals/ErrorModal';
import KnowledgeModal from '@/components/oral/modals/KnowledgeModal';
import ReportModal from '@/components/oral/modals/ReportModal';

// Section imports
import ImageUploadArea from '@/components/oral/ImageUploadArea';
import DiagnosisResults from '@/components/oral/DiagnosisResults';
import ControlButtons from '@/components/oral/ControlButtons';
import BottomControls from '@/components/oral/BottomControls';
import DeepDiagnosisResults from '@/components/oral/DeepDiagnosisResults';
import EnhancedFileUpload from '@/components/oral/EnhancedFileUpload';
import DualNavigationControls from '@/components/oral/DualNavigationControls';
import DeepDetectionVisualization from '@/components/oral/DeepDetectionVisualization';
import DeepDiagnosisInfo from '@/components/oral/DeepDiagnosisInfo';

// Hook imports
import { useOralDiagnosis } from '@/hooks/useOralDiagnosis';
import { useFileUploadWithCompression } from '@/hooks/useFileUploadWithCompression';
import { useBatchPatientManagement } from '@/hooks/useBatchPatientManagement';

// Type imports
import { Patient } from '@shared/types';
import { PatientFolderInfo } from '@/utils/folderParser';

const OralDiagnosisInterface: React.FC = () => {
  const colors = useColors();
  const router = useRouter();
  
  // 模式管理 - 区分单文件模式和患者文件夹模式
  const [interfaceMode, setInterfaceMode] = useState<'none' | 'single' | 'folder'>('none');
  
  // 压缩状态管理
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState({ current: 0, total: 0 });
  const [compressionStats, setCompressionStats] = useState<{
    originalTotalSize: number;
    compressedTotalSize: number;
    fileCount: number;
  } | null>(null);
  
  // 批量患者管理
  const batchPatientManagement = useBatchPatientManagement();
  
  // State management using custom hooks
  const {
    // Diagnosis state
    selectedImage,
    selectedFile,
    isDetecting,
    detectionComplete,
    detectionResults,
    diagnosisResponse,
    deepMode,
    deepDetectionResults,
    isDeepLoading,
    canShowDeepButton,
    
    // Modal state
    showInstructions,
    showError,
    showKnowledge,
    showReport,
    error,
    
    // Patient management
    patientManagement,
    
    // Diagnosis actions
    setShowError,
    setShowInstructions,
    setShowKnowledge,
    setShowReport,
    setError,
    setDeepMode,
    
    // Diagnosis handlers
    handleImageSelect,
    handleDetectionStart,
    handleReset,
    handleStartDeepDetection,
    
    // Computed values
    buttonsEnabled,
    canStartDetection
  } = useOralDiagnosis();
  
  const { 
    handleFileUpload, 
    handleFolderUpload, 
    isCompressing: hookIsCompressing, 
    compressionProgress: hookCompressionProgress 
  } = useFileUploadWithCompression({
    onImageSelect: (image: string | null, file: File | null) => {
      if (file && image) {
        // 检查是否是批量导入的一部分
        if (!batchPatientManagement.isReady) {
          // 单文件模式（但不在这里设置 interfaceMode，避免与文件夹批量导入的同步竞态）
          batchPatientManagement.addSinglePatient(file);
        }
        handleImageSelect(image, file);
      }
    },
    onDetectionReset: () => {
      handleReset();
      // 在图片改变时重置深度检测状态
      setDeepMode?.(false);
    },
    onError: (error: string) => {
      setError?.(error);
      setShowError(true);
    },
    onBatchImport: (patients: PatientFolderInfo[]) => {
      console.log('[OralInterface] onBatchImport 被调用, 新增患者数:', patients.length, '当前已有患者数:', batchPatientManagement.totalPatients);
      patients.forEach((p: PatientFolderInfo, idx: number) => {
        console.log(`[OralInterface] 新增患者 ${idx + 1}: 姓名=${p.name}, 图片数=${p.images.length}, 诊断=${p.diagnosis}`);
      });
      
      batchPatientManagement.importPatients(patients);
      // 确保进入文件夹模式
      setInterfaceMode('folder');
      console.log('[OralInterface] 累积导入完成，总患者数:', batchPatientManagement.totalPatients + patients.length);
    },
    onCompressionStart: () => {
      setIsCompressing(true);
      setCompressionStats(null);
    },
    onCompressionProgress: (current: number, total: number) => {
      setCompressionProgress({ current, total });
    },
    onCompressionComplete: (results: { originalTotalSize: number; compressedTotalSize: number; fileCount: number }) => {
      setIsCompressing(false);
      setCompressionProgress({ current: 0, total: 0 });
      setCompressionStats(results);
      
      // 显示压缩完成的提示
      setTimeout(() => {
        setCompressionStats(null);
      }, 5000); // 5秒后自动隐藏
    }
  });

  // 单文件上传包装：显式切换到 single 模式，避免在 onImageSelect 中的竞态条件
  const handleSingleFileUpload = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInterfaceMode('single');
    handleFileUpload(e);
  }, [handleFileUpload]);

  // 返回处理函数 - 修改为"清空并返回"
  const handleBackAction = useCallback(() => {
    if (interfaceMode !== 'none') {
      // 1. 复位界面模式
      setInterfaceMode('none');
      // 2. 清空诊断/图片状态
      handleReset();
      setDeepMode?.(false);
      // 3. 清空批量患者管理缓存
      batchPatientManagement.clear();
      // 4. 彻底清空当前患者数据（包括 usePatientManagement 内部）
      try {
        patientManagement.setPatients([] as any);
        patientManagement.setCurrentPatientData({
          id: 'N/A',
          name: '未选择患者',
          history: '无',
          date: 'N/A',
          index: 'N/A',
          biopsyConfirmed: false,
          doctor: 'N/A'
        });
      } catch (e) {
        console.warn('[OralDiagnosisInterface] 清空患者信息时出现非致命异常', e);
      }
      return false; // 阻止默认跳转
    }
    return true;
  }, [interfaceMode, handleReset, batchPatientManagement, setDeepMode, patientManagement]);

  // 监听批量患者管理中的当前图片变化，同步到 selectedImage
  React.useEffect(() => {
    if (batchPatientManagement.currentImageUrl && batchPatientManagement.currentImage) {
      // 当批量管理中切换图片时，更新选中的图片
      if (selectedImage !== batchPatientManagement.currentImageUrl) {
        console.log('[OralInterface] 同步图片到界面:', batchPatientManagement.currentImageUrl, 'mode=', interfaceMode);
        handleImageSelect(batchPatientManagement.currentImageUrl, batchPatientManagement.currentImage);
      }
    }
  }, [batchPatientManagement.currentImageUrl, batchPatientManagement.currentImage]);

  // 监听批量患者管理中的当前患者变化，同步到患者管理钩子
  React.useEffect(() => {
    console.log('[OralInterface] 患者同步useEffect触发 - currentPatient:', batchPatientManagement.currentPatient?.name, 'interfaceMode:', interfaceMode);
    
    if (batchPatientManagement.currentPatient && interfaceMode === 'folder') {
      const batchPatient = batchPatientManagement.currentPatient;
      
      // 【修改】跳过占位符患者的信息同步
      if (batchPatient.id === 'placeholder-patient') {
        console.log('[OralInterface] 跳过占位符患者的信息同步，自动切换到下一个患者');
        // 如果当前是占位符患者，自动切换到下一个真实患者
        batchPatientManagement.handleNextPatient();
        return;
      }
      
      console.log('[OralInterface] 同步患者信息 - 当前患者:', batchPatient);
      
      // 将批量患者管理的患者信息同步到常规患者管理
      if (batchPatient.folderInfo) {
        const syncedPatient: Patient = {
          id: batchPatient.id,
          name: batchPatient.folderInfo.name,
          index: batchPatient.folderInfo.caseNumber,
          history: batchPatient.folderInfo.diagnosis,
          date: batchPatient.folderInfo.date,
          biopsyConfirmed: batchPatient.folderInfo.hasBiopsy,
          doctor: batchPatient.doctor || 'N/A'
        };
        console.log('[OralInterface] 同步批量患者信息到界面:', syncedPatient);
        patientManagement.setCurrentPatientData(syncedPatient);
      }
    }
  }, [batchPatientManagement.currentPatient, interfaceMode]);

  return (
    <div className={`min-h-screen ${colors.bgPrimary} relative overflow-hidden`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mt-20 mb-8">
          <h1 className={`text-4xl font-bold ${colors.textPrimary} mb-4`}>
            {deepMode ? '口腔黏膜潜在恶性疾病智能辅助诊断' : '口腔黏膜潜在恶性疾病智能早期筛查'}
          </h1>
        </div>
        
        {/* Main Interface */}
        <div className="max-w-6xl mx-auto">
          <GlassCard className="p-8">
            {/* Top Control Buttons */}
            <ControlButtons 
              onFileUpload={handleSingleFileUpload}
              onFolderUpload={handleFolderUpload}
              onShowInstructions={() => setShowInstructions(true)}
              interfaceMode={interfaceMode}
              onBackAction={handleBackAction}
            />
            
            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Image Display and Patient Navigation */}
              <div className="space-y-4">
                {/* 压缩进度显示 */}
                <CompressionProgress
                  isVisible={isCompressing || hookIsCompressing}
                  current={compressionProgress.current || hookCompressionProgress.current}
                  total={compressionProgress.total || hookCompressionProgress.total}
                  stats={compressionStats}
                  onStatsClose={() => setCompressionStats(null)}
                />
                
                {/* 【新增】无患者时的提示 */}
                {interfaceMode === 'none' && (
                  <div className="bg-blue-50/10 border border-blue-200/30 rounded-lg p-6 text-center">
                    <div className="text-blue-400 mb-3">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className={`text-lg font-medium ${colors.textPrimary} mb-2`}>
                      开始医学影像诊断
                    </h3>
                    <p className={`text-sm ${colors.textSecondary} mb-4`}>
                      请选择上传单张图片或批量上传患者文件夹
                    </p>
                    <div className="text-xs text-gray-400">
                      支持 JPG、PNG、WebP 格式图片
                    </div>
                  </div>
                )}
                
                {/* 【新增】患者导航控件（仅在folder模式下显示） */}
                {interfaceMode === 'folder' && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={batchPatientManagement.handlePrevPatient}
                        disabled={!batchPatientManagement.canNavigatePrevPatient}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          batchPatientManagement.canNavigatePrevPatient 
                            ? colors.buttonGhost + ' hover:bg-white/10' 
                            : 'bg-gray-500/50 cursor-not-allowed text-gray-400'
                        }`}
                      >
                        ← 上一个患者
                      </button>
                      
                      <div className={`${colors.textPrimary} text-sm font-medium text-center`}>
                        <div>
                          患者 {batchPatientManagement.currentPatientIndex + 1} / {batchPatientManagement.totalPatients}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          共 {batchPatientManagement.totalPatients} 个患者
                        </div>
                      </div>
                      
                      <button
                        onClick={batchPatientManagement.handleNextPatient}
                        disabled={!batchPatientManagement.canNavigateNextPatient}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          batchPatientManagement.canNavigateNextPatient 
                            ? colors.buttonGhost + ' hover:bg-white/10' 
                            : 'bg-gray-500/50 cursor-not-allowed text-gray-400'
                        }`}
                      >
                        下一个患者 →
                      </button>
                    </div>
                  </div>
                )}
                
                <ImageUploadArea 
                  // selectedImage={patientManagement.isCurrentPatientDummy ? selectedImage : (diagnosisResponse?.data.imageUrl || selectedImage)}
                  selectedImage={selectedImage}
                  onFileUpload={handleFileUpload}
                />
                
                {/* 【新增】深度模式下在左侧显示检测框可视化 */}
                {deepMode && (
                  <DeepDetectionVisualization
                    results={deepDetectionResults || undefined}
                  />
                )}
              </div>
              
              {/* Right Side - Patient Info and Diagnosis Results */}
              <div className="space-y-6">
                {deepMode ? (
                  <>
                    <DeepDiagnosisInfo
                      results={deepDetectionResults || undefined}
                      patientData={patientManagement.currentPatientData}
                      finding={deepDetectionResults?.finding || diagnosisResponse?.data.results.finding}
                      recommendation={deepDetectionResults?.recommendation || diagnosisResponse?.data.results.recommendation}
                    />
                    {/* 实例分割按钮：深度模式（三分类）完成后出现 */}
                    {deepDetectionResults && !isDeepLoading && (
                      <div className="pb-6">
                        <button
                          onClick={() => {
                            if (selectedImage) {
                              // 保存当前患者数据到 sessionStorage
                              sessionStorage.setItem('oral_current_patient_data', JSON.stringify(patientManagement.currentPatientData));
                              router.push(`/oral/segmentation?image=${encodeURIComponent(selectedImage)}`);
                            }
                          }}
                          disabled={!selectedImage}
                          className="w-full py-3 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium hover:opacity-90 disabled:opacity-60 transition shadow-md"
                        >
                          病灶区域分割
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <DiagnosisResults 
                      results={detectionResults ?? undefined}
                      finding={diagnosisResponse?.data.results.finding}
                      recommendation={diagnosisResponse?.data.results.recommendation}
                      patientData={patientManagement.currentPatientData}
                      diagnosisResponse={diagnosisResponse}
                    />
                    {canShowDeepButton && (
                      <div className="pb-6">
                        <button
                          onClick={handleStartDeepDetection}
                          disabled={isDeepLoading}
                          className="w-full py-3 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 disabled:opacity-60 transition shadow-md"
                        >
                          {isDeepLoading ? '深度检测中 请耐心等待...' : '进一步辅助诊断'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Bottom Controls */}
            <BottomControls 
              buttonsEnabled={buttonsEnabled}
              onShowReport={() => setShowReport(true)}
              onShowKnowledge={() => setShowKnowledge(true)}
              selectedImage={selectedImage}
              isDetecting={isDetecting}
              onStartDetection={handleDetectionStart}
              currentPatient={batchPatientManagement.isReady ? batchPatientManagement.currentPatientIndex : patientManagement.currentPatient}
              totalPatients={batchPatientManagement.isReady ? batchPatientManagement.totalPatients : patientManagement.totalPatients}
              onPrevPatient={batchPatientManagement.isReady ? batchPatientManagement.handlePrevPatient : patientManagement.handlePrevPatient}
              onNextPatient={batchPatientManagement.isReady ? batchPatientManagement.handleNextPatient : patientManagement.handleNextPatient}
              // 图片导航 - 强制在folder模式下显示
              currentImageIndex={batchPatientManagement.currentImageIndex}
              totalImages={batchPatientManagement.totalImages}
              onPrevImage={batchPatientManagement.handlePrevImage}
              onNextImage={batchPatientManagement.handleNextImage}
              canNavigatePrevImage={batchPatientManagement.canNavigatePrevImage}
              canNavigateNextImage={batchPatientManagement.canNavigateNextImage}
              // 传递模式信息
              interfaceMode={interfaceMode}
            />
          </GlassCard>
        </div>
      </div>
      
      {/* Modals */}
      <InstructionsModal 
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
      
      <ErrorModal
        isOpen={showError}
        onClose={() => setShowError(false)}
        errorMessage={error}
      />
      
      <KnowledgeModal 
        isOpen={showKnowledge}
        onClose={() => setShowKnowledge(false)}
        knowledgeContent={deepMode ? 
          (deepDetectionResults?.knowledge || diagnosisResponse?.data.results.knowledge) :
          diagnosisResponse?.data.results.knowledge
        }
      />
      
      <ReportModal 
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        patientData={patientManagement.currentPatientData}
        finding={deepMode ?
          (deepDetectionResults?.finding || diagnosisResponse?.data.results.finding) :
          diagnosisResponse?.data.results.finding
        }
        recommendation={deepMode ?
          (deepDetectionResults?.recommendation || diagnosisResponse?.data.results.recommendation) :
          diagnosisResponse?.data.results.recommendation
        }
        diagnosisResponse={diagnosisResponse}
        deepDetectionResults={deepDetectionResults}
        selectedImage={selectedImage}
        isDeepMode={deepMode}
      />
    </div>
  );
};

export default OralDiagnosisInterface;