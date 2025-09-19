// 实例分割结果展示页面
'use client'
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useColors } from '@/config/colors';
import GlassCard from '@/components/ui/GlassCard';
import { runSegmentation, checkSegmentationEnvironment } from '@/services/segmentation';

// 预留后端接口返回的数据类型
interface SegmentationResultDTO {
  overlayImageUrl: string; // 分割后叠加图 URL (静态文件或API代理路径)
  maskImageUrl?: string;   // 可选：仅mask图
  inferenceTimeMs?: number;
  modelVersion?: string;
  meta?: Record<string, any>;
}

// 患者数据接口
interface PatientData {
  name: string;
  id: string;
  history: string;
  date: string;
  index: string;
  biopsyConfirmed: boolean;
  doctor: string;
}

const OralSegmentationPage: React.FC = () => {
  const colors = useColors();
  const params = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [result, setResult] = useState<SegmentationResultDTO | null>(null);
  const [environmentReady, setEnvironmentReady] = useState<boolean>(true);

  // 患者信息从 sessionStorage 恢复或使用默认值
  const [patientInfo, setPatientInfo] = useState<PatientData>(() => ({
    name: '待接入',
    id: 'N/A',
    history: 'N/A',
    date: new Date().toLocaleDateString(),
    index: 'N/A',
    biopsyConfirmed: false,
    doctor: 'N/A'
  }));

  // 检查分割环境
  useEffect(() => {
    checkSegmentationEnvironment().then(env => {
      setEnvironmentReady(env.ready);
      if (!env.ready) {
        setError(`分割环境未就绪: ${env.message}`);
      }
    });
  }, []);

  useEffect(() => {
    // 尝试从 sessionStorage 恢复患者信息
    const cachedPatientData = sessionStorage.getItem('oral_current_patient_data');
    if (cachedPatientData) {
      try {
        const patientData = JSON.parse(cachedPatientData);
        setPatientInfo({
          name: patientData.name || '未知患者',
          id: patientData.id || 'N/A',
          history: patientData.history || 'N/A',
          date: patientData.date || new Date().toLocaleDateString(),
          index: patientData.index || 'N/A',
          biopsyConfirmed: patientData.biopsyConfirmed || false,
          doctor: patientData.doctor || 'N/A'
        });
      } catch (e) {
        console.warn('无法解析患者数据:', e);
      }
    }
  }, []);

  // 将 blob URL 转换为 base64
  const convertBlobToBase64 = async (blobUrl: string): Promise<string> => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error('图片格式转换失败');
    }
  };

  useEffect(() => {
    const imageParam = params.get('image');
    if (!imageParam) {
      setError('缺少图片参数');
      setLoading(false);
      return;
    }
    const decoded = decodeURIComponent(imageParam);
    setRawImage(decoded);
    
    // 只有环境就绪时才执行分割
    if (environmentReady) {
      // 自动发起实例分割请求
      (async () => {
        try {
          // 检查是否为 blob URL，如果是则转换为 base64
          let imageData = decoded;
          if (decoded.startsWith('blob:')) {
            console.log('检测到 blob URL，正在转换为 base64...');
            imageData = await convertBlobToBase64(decoded);
            console.log('转换完成，base64 长度:', imageData.length);
          }
          
          const seg = await runSegmentation({ image: imageData });
          console.log('[Segmentation Page] 接收到的分割结果:', seg);
          console.log('[Segmentation Page] 叠加图URL:', seg.overlayImageUrl);
          setResult(seg);
        } catch (e: any) {
          setError(e.message || '分割请求失败');
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [params, environmentReady]);

  return (
    <main className={`${colors.bgPrimary} min-h-screen relative overflow-hidden`}>      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-24 right-24 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay:'2s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8 mt-8">
          <h1 className={`text-3xl font-bold ${colors.textPrimary}`}>口腔黏膜潜在恶性疾病病灶可视化</h1>
          <button
            onClick={() => {
              // 清除分割相关的 sessionStorage 数据
              sessionStorage.removeItem('oral_current_patient_data');
              // 跳转回诊断页面，诊断页面的现有重置逻辑会处理状态清理
              router.push('/oral/diagnosis');
            }}
            className="px-4 py-2 rounded-md bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-medium hover:opacity-90 transition"
          >
            清空并返回
          </button>
        </div>

        <GlassCard className="p-6">
          {loading && (
            <div className="py-20 text-center">
              <div className="text-gray-300 mb-2">实例分割处理中，请稍候...</div>
              <div className="text-xs text-gray-400">正在调用 MMDETECTION 分割算法</div>
            </div>
          )}
          {error && (
            <div className="py-20 text-center">
              <div className="text-red-400 mb-2">{error}</div>
              {!environmentReady && (
                <div className="text-xs text-gray-400 mt-2">
                  请检查 Python 环境和模型文件是否正确配置
                </div>
              )}
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 原图 */}
              <div className="flex flex-col">
                <h3 className="text-sm font-medium text-gray-200 mb-2">原始图像</h3>
                <div className="relative rounded-lg border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center min-h-[260px]">
                  {rawImage ? (
                    <img src={rawImage} alt="原图" className="object-contain max-h-[420px]" />
                  ) : (
                    <span className="text-xs text-gray-400">无</span>
                  )}
                </div>
              </div>

              {/* 分割叠加图 */}
              <div className="flex flex-col">
                <h3 className="text-sm font-medium text-gray-200 mb-2">病灶可视化</h3>
                <div className="relative rounded-lg border border-emerald-400/30 bg-emerald-500/5 overflow-hidden flex items-center justify-center min-h-[260px]">
                  {result?.overlayImageUrl ? (
                    <>
                      <img 
                        src={result.overlayImageUrl} 
                        alt="分割叠加" 
                        className="object-contain max-h-[420px]"
                        crossOrigin="anonymous"
                        onLoad={() => console.log('[Segmentation Page] 图片加载成功:', result.overlayImageUrl)}
                        onError={(e) => {
                          console.error('[Segmentation Page] 图片加载失败:', result.overlayImageUrl);
                          console.error('[Segmentation Page] 错误详情:', e);
                        }}
                      />
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">等待结果</span>
                  )}
                </div>
                <div className="mt-3 text-[11px] text-gray-400 space-y-1">
                  {result?.modelVersion && <div>模型版本：{result.modelVersion}</div>}
                  {result?.inferenceTimeMs && <div>推理耗时：{result.inferenceTimeMs} ms</div>}
                </div>
              </div>

              {/* 患者信息 */}
              <div className="flex flex-col">
                <h3 className="text-sm font-medium text-gray-200 mb-2">患者信息</h3>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-300 space-y-2">
                  <div><span className="text-gray-400">姓名：</span>{patientInfo.name}</div>
                  <div><span className="text-gray-400">主病案号：</span>{patientInfo.index}</div>
                  <div><span className="text-gray-400">历史诊断：</span>{patientInfo.history}</div>
                  <div><span className="text-gray-400">时间：</span>{patientInfo.date}</div>
                  <div><span className="text-gray-400">活检确认：</span>{patientInfo.biopsyConfirmed ? '是' : '否'}</div>
                  <div><span className="text-gray-400">医生：</span>{patientInfo.doctor}</div>
                  <div className="pt-2 text-[11px] text-gray-400 border-t border-white/10">（患者信息已从诊断页面同步）</div>
                </div>

                {/* 预留：重新触发分割 */}
                <button
                  onClick={async () => {
                    if (!rawImage) return;
                    setLoading(true);
                    try {
                      // 检查是否为 blob URL，如果是则转换为 base64
                      let imageData = rawImage;
                      if (rawImage.startsWith('blob:')) {
                        console.log('重新分割：检测到 blob URL，正在转换为 base64...');
                        imageData = await convertBlobToBase64(rawImage);
                      }
                      
                      const seg = await runSegmentation({ image: imageData });
                      console.log('[Segmentation Page] 重新分割结果:', seg);
                      console.log('[Segmentation Page] 重新分割叠加图URL:', seg.overlayImageUrl);
                      setResult(seg);
                    } catch (e: any) {
                      setError(e.message || '重新分割失败');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || !rawImage || !environmentReady}
                  className="mt-4 w-full py-2 rounded-md bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  重新分割
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </main>
  );
};

export default OralSegmentationPage;
