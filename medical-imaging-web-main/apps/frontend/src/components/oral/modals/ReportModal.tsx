import React from 'react';
import { Download, Printer, X } from 'lucide-react';
import { Patient } from '@shared/types';
import { useColors } from '@/config/colors';
import { useHandleReport } from '@/hooks/useHandleReport';
import { OralDiagnosisResponse, DeepDetectionResults } from '@/types/oral';
import GlassCard from '@/components/ui/GlassCard';
import { useMemo, useState, useCallback } from 'react';

// Types
interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientData: Patient;
  finding?: string;
  recommendation?: string;
  diagnosisResponse?: OralDiagnosisResponse | null;
  deepDetectionResults?: DeepDetectionResults | null; // 新增：深度检测结果
  selectedImage?: string | null; // 新增：原始图片URL
  isDeepMode?: boolean; // 新增：是否为深度检测模式
  onDownloadReport?: () => void; // Keep for backward compatibility
  onPrintReport?: () => void; // Keep for backward compatibility
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  patientData,
  finding = '无诊断结果',
  recommendation = 'N/A',
  diagnosisResponse = null,
  deepDetectionResults = null,
  selectedImage = null,
  isDeepMode = false,
  onDownloadReport: legacyDownloadReport,
  onPrintReport: legacyPrintReport
}) => {
  const colors = useColors();
  
  // Use the custom hook for report handling
  // 深度模式下优先使用深度检测的详细报告建议 / 建议
  const detailedRecommendation = (
    isDeepMode && deepDetectionResults?.reportRecommendation
      ? deepDetectionResults.reportRecommendation
      : diagnosisResponse?.data?.results?.reportRecommendation
  ) || recommendation;
  const { handleDownloadReport, handlePrintReport } = useHandleReport({
    patientData,
    diagnosisResponse,
    finding,
    recommendation: detailedRecommendation,
    deepDetectionResults,
    selectedImage,
    isDeepMode
  });
  
  // Safety check for patientData
  const safePatientData = patientData;
  
  if (!isOpen) return null;
  
  // Use the hook handlers or fallback to legacy handlers
  const onDownload = handleDownloadReport || legacyDownloadReport || (() => {});
  const onPrint = handlePrintReport || legacyPrintReport || (() => {});

  /* ---------------------------------------------
     内联子组件：深度检测概览（图片 + 4 类置信度）
     目的：与 DeepDetectionVisualization 统一 URL 构建与容错
  --------------------------------------------- */
  const DeepDetectionOverview: React.FC<{ deepDetectionResults: DeepDetectionResults; colors: any }> = ({ deepDetectionResults, colors }) => {
    const [imgError, setImgError] = useState(false);
    const [retry, setRetry] = useState(0);
    const rawApiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const apiBase = rawApiBase.replace(/\/api\/?$/, '');
    const annotatedImgSrc = useMemo(() => {
      const val = deepDetectionResults?.annotatedImage || '';
      if (!val) return '';
      if (/^https?:\/\//i.test(val)) return val;
      // 去掉可能的重复前缀: 如果 val 已以 /uploads 开头，直接拼接 base
      const normalized = val.startsWith('/') ? val : `/${val}`;
      return `${apiBase}${normalized}`;
    }, [deepDetectionResults?.annotatedImage, apiBase, retry]);

    const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
      console.error('[ReportModal][DeepDetection] 图片加载失败:', {
        annotatedImageRaw: deepDetectionResults?.annotatedImage,
        constructed: annotatedImgSrc,
        apiBase
      });
      setImgError(true);
      (e.currentTarget as HTMLImageElement).style.opacity = '0.35';
    }, [annotatedImgSrc, deepDetectionResults?.annotatedImage, apiBase]);

    const handleRetry = () => {
      setImgError(false);
      setRetry(r => r + 1);
    };

    // 生成防缓存参数（在 304 + NotSameOrigin 场景下可触发新请求）
    const finalSrc = annotatedImgSrc ? `${annotatedImgSrc}?v=${retry}` : '';

    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="w-full max-w-md border border-white/10 rounded-lg overflow-hidden relative">
            {finalSrc ? (!imgError ? (
              <img
                key={finalSrc}
                src={finalSrc}
                alt="深度检测可视化"
                className="w-full object-contain max-h-64 bg-black/20"
                crossOrigin="anonymous"
                onError={handleError}
              />
            ) : (
              <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-900/40 text-center p-4">
                <p className={`${colors.textSecondary} text-sm mb-2`}>深度检测图片加载失败</p>
                <p className="text-[10px] text-gray-500 break-all max-w-full mb-3 leading-tight">
                  {finalSrc}
                </p>
                <button
                  onClick={handleRetry}
                  className="px-3 py-1.5 text-xs rounded bg-blue-500 hover:bg-blue-600 text-white transition"
                >重试加载</button>
              </div>
            )) : (
              <div className="w-full h-32 flex items-center justify-center bg-gray-100/10 text-gray-400 text-sm">
                深度检测图片不可用
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'OLK', name: '口腔白斑病', color: 'bg-yellow-400' },
            { key: 'OLP', name: '口腔扁平苔藓', color: 'bg-blue-400' },
            { key: 'OSF', name: '口腔黏膜下纤维性变', color: 'bg-purple-400' },
            { key: 'OPMD', name: '口腔潜在恶性疾病', color: 'bg-red-400' }
          ].map(({ key, name, color }) => {
            const value = (deepDetectionResults as any)[key] || 0;
            const pct = (value * 100).toFixed(1);
            return (
              <div key={key} className="text-center p-3 bg-white/5 rounded-lg">
                <div className={`text-lg font-bold ${colors.textPrimary} mb-1`}>{pct}%</div>
                <div className={`text-xs ${colors.textSecondary} mb-2`}>{name} ({key})</div>
                <div className="w-full bg-gray-200/20 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${color} transition-all duration-300`} style={{ width: `${Math.min(Math.max(value * 100, 0), 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="max-w-4xl max-h-[90vh] w-full mx-4 relative">
        <GlassCard className="w-full overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <h2 className={`text-2xl font-bold ${colors.textPrimary}`}>
              报告查看与保存
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${colors.buttonGhost} transition-colors`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
            <div className="p-6 space-y-6">
              {/* Patient Information Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={colors.textSecondary}>患者姓名:</span>
                    <span className={colors.textPrimary}>{safePatientData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={colors.textSecondary}>历史诊断:</span>
                    <span className={colors.textPrimary}>{safePatientData.history}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={colors.textSecondary}>主病案号:</span>
                    <span className={colors.textPrimary}>{safePatientData.index}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={colors.textSecondary}>诊断时间:</span>
                    <span className={colors.textPrimary}>{safePatientData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={colors.textSecondary}>活检确认:</span>
                    <span className={colors.textPrimary}>{safePatientData.biopsyConfirmed ? '已活检' : '未活检'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={colors.textSecondary}>诊断医师:</span>
                    <span className={colors.textPrimary}>{safePatientData.doctor}</span>
                  </div>
                </div>
              </div>
              
              {/* Detection Results Section - 根据检测模式显示不同内容 */}
              {(diagnosisResponse?.data?.results || deepDetectionResults) && (
                <div className="border-t border-white/20 pt-4">
                  <h4 className={`font-medium ${colors.textPrimary} mb-4`}>
                    检测结果概览
                  </h4>
                  
                  {isDeepMode && deepDetectionResults ? (
                    /* 深度检测模式：显示带检测框的图片 + 四个置信度条（与 DeepDetectionVisualization 逻辑对齐） */
                    <DeepDetectionOverview
                      deepDetectionResults={deepDetectionResults}
                      colors={colors}
                    />
                  ) : (
                    /* 二分类模式：显示原始图片 + 两个置信度条 */
                    <div className="space-y-4">
                      {/* 原始上传图片 */}
                      <div className="flex justify-center">
                        <div className="w-full max-w-md border border-white/10 rounded-lg overflow-hidden">
                          {selectedImage ? (
                            <img 
                              src={selectedImage}
                              alt="上传的图片" 
                              className="w-full object-contain max-h-64" 
                              onError={(e) => {
                                console.error('原始图片加载失败');
                                (e.currentTarget as HTMLImageElement).style.opacity = '0.4';
                              }}
                            />
                          ) : (
                            <div className="w-full h-32 flex items-center justify-center bg-gray-100/10 text-gray-400 text-sm">
                              原始图片不可用
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 两个置信度条 */}
                      <div className="grid grid-cols-2 gap-4">
                        {(() => {
                          // 解析二分类置信度
                          const predictedClass = diagnosisResponse?.data?.results?.predicted_class;
                          const confidence = diagnosisResponse?.data?.results?.confidence;
                          
                          let benignConfidence = 0.5; // 默认值
                          let opmdConfidence = 0.5;   // 默认值
                          
                          if (predictedClass && confidence !== undefined) {
                            if (predictedClass === 'Benign') {
                              benignConfidence = confidence;
                              opmdConfidence = 1 - confidence;
                            } else if (predictedClass === 'OPMD') {
                              opmdConfidence = confidence;
                              benignConfidence = 1 - confidence;
                            }
                          } else if (diagnosisResponse?.data?.results?.OPMD !== undefined) {
                            // 回退到旧的 OPMD 字段
                            opmdConfidence = diagnosisResponse.data.results.OPMD;
                            benignConfidence = 1 - opmdConfidence;
                          }
                          
                          return [
                            { 
                              name: '健康或其他良性疾病', 
                              key: 'Benign', 
                              value: benignConfidence, 
                              color: 'bg-green-400' 
                            },
                            { 
                              name: '恶性或潜在恶性疾病', 
                              key: 'OPMD', 
                              value: opmdConfidence, 
                              color: 'bg-red-400' 
                            }
                          ].map(({ name, key, value, color }) => {
                            const percentage = (value * 100).toFixed(1);
                            return (
                              <div key={key} className="text-center p-4 bg-white/5 rounded-lg">
                                <div className={`text-xl font-bold ${colors.textPrimary} mb-1`}>
                                  {percentage}%
                                </div>
                                <div className={`text-xs ${colors.textSecondary} mb-3`}>
                                  {name} ({key})
                                </div>
                                <div className="w-full bg-gray-200/20 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${color} transition-all duration-300`}
                                    style={{ width: `${Math.min(Math.max(value * 100, 0), 100)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Diagnosis Results Section */}
              <div className="border-t border-white/20 pt-4">
                <h4 className={`font-medium ${colors.textPrimary} mb-2`}>
                  辅助诊断结果
                </h4>
                <div className={`p-4 bg-white/5 rounded-lg ${colors.textSecondary}`}>
                  {isDeepMode && deepDetectionResults?.finding ? deepDetectionResults.finding : finding}
                </div>
                
                <h4 className={`font-medium ${colors.textPrimary} mb-2 mt-4`}>
                  诊断建议
                </h4>
                <div className={`p-4 bg-white/5 rounded-lg ${colors.textSecondary} text-sm leading-relaxed`}>
                  {isDeepMode && deepDetectionResults?.reportRecommendation ? deepDetectionResults.reportRecommendation : detailedRecommendation}
                </div>
              </div>
              
              {/* Confirmation and Action Buttons */}
              <div className="flex justify-end border-t border-white/20 pt-4">                
                <div className="flex gap-3">
                  <button
                    onClick={onDownload}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${colors.buttonPrimary} ${colors.textLight} flex items-center gap-2 hover:scale-105`}
                  >
                    <Download className="w-4 h-4" />
                    详细报告
                  </button>
                  
                  <button
                    onClick={onPrint}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${colors.buttonPrimary} ${colors.textLight} flex items-center gap-2 hover:scale-105`}
                  >
                    <Printer className="w-4 h-4" />
                    打印报告
                  </button>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ReportModal;