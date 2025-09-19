// hooks/useHandleReport.tsx
import { useCallback } from 'react';
import { Patient } from '@shared/types';
import { OralDiagnosisResponse, DeepDetectionResults } from '@/types/oral';

interface UseHandleReportProps {
  patientData: Patient;
  diagnosisResponse: OralDiagnosisResponse | null;
  finding?: string;
  recommendation?: string;
  deepDetectionResults?: DeepDetectionResults | null; // 新增：深度检测结果
  selectedImage?: string | null; // 新增：原始图片URL
  isDeepMode?: boolean; // 新增：是否为深度检测模式
}

interface UseHandleReportReturn {
  handleDownloadReport: () => void;
  handlePrintReport: () => void;
}

export const useHandleReport = ({
  patientData,
  diagnosisResponse,
  finding = '无诊断结果',
  recommendation = 'N/A',
  deepDetectionResults = null,
  selectedImage = null,
  isDeepMode = false
}: UseHandleReportProps): UseHandleReportReturn => {

  // Generate report content as HTML
  const generateReportHTML = useCallback(() => {
    const currentDate = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    // --------------------------------------------------
    // 预处理：构建深度检测图片的绝对地址（防止下载后的本地 file:// 打开时相对路径失效）
    // --------------------------------------------------
    let deepAnnotatedImageAbsolute: string | '' = '';
    if (isDeepMode && deepDetectionResults?.annotatedImage) {
      const rawVal = deepDetectionResults.annotatedImage.trim();
      const envApi = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
      const cleanedEnvApi = envApi.replace(/\/api\/?$/, '');
      const origin = (typeof window !== 'undefined' && window.location ? window.location.origin : '');
      const candidateBase = cleanedEnvApi || origin;
      if (/^https?:\/\//i.test(rawVal)) {
        deepAnnotatedImageAbsolute = rawVal;
      } else if (candidateBase) {
        const normalizedPath = rawVal.startsWith('/') ? rawVal : `/${rawVal}`;
        deepAnnotatedImageAbsolute = `${candidateBase}${normalizedPath}`;
      } else {
        // 最后退：保持原值（可能在同源线上打开仍可访问）
        deepAnnotatedImageAbsolute = rawVal;
      }
    }

    // --------------------------------------------------
    // 构建“检测结果”版块 HTML（拆出便于调试与保证字符串安全）
    // --------------------------------------------------
    const detectionSectionHTML = (() => {
      // 深度检测模式
      if (isDeepMode && deepDetectionResults) {
        return `
          ${deepAnnotatedImageAbsolute ? `
            <div class="image-container">
              <img src="${deepAnnotatedImageAbsolute}" alt="深度检测结果图" class="report-image" />
              <div class="image-caption">深度检测可视化结果（含检测框标注）</div>
            </div>
          ` : '<div class="image-caption" style="text-align:center;">深度检测结果图缺失或无法构建绝对路径</div>'}
          <div class="results-section">
            <div class="result-item">
              <div class="result-label">口腔白斑病<br>(OLK)</div>
              <div class="result-value">${(deepDetectionResults.OLK * 100).toFixed(1)}%</div>
              <div class="confidence-bar"><div class="confidence-fill olk" style="width:${Math.min(Math.max(deepDetectionResults.OLK * 100,0),100)}%"></div></div>
            </div>
            <div class="result-item">
              <div class="result-label">口腔扁平苔藓<br>(OLP)</div>
              <div class="result-value">${(deepDetectionResults.OLP * 100).toFixed(1)}%</div>
              <div class="confidence-bar"><div class="confidence-fill olp" style="width:${Math.min(Math.max(deepDetectionResults.OLP * 100,0),100)}%"></div></div>
            </div>
            <div class="result-item">
              <div class="result-label">口腔黏膜下纤维性变<br>(OSF)</div>
              <div class="result-value">${(deepDetectionResults.OSF * 100).toFixed(1)}%</div>
              <div class="confidence-bar"><div class="confidence-fill osf" style="width:${Math.min(Math.max(deepDetectionResults.OSF * 100,0),100)}%"></div></div>
            </div>
            <div class="result-item">
              <div class="result-label">口腔潜在恶性疾病<br>(OPMD)</div>
              <div class="result-value">${((deepDetectionResults.OPMD || 0) * 100).toFixed(1)}%</div>
              <div class="confidence-bar"><div class="confidence-fill opmd" style="width:${Math.min(Math.max((deepDetectionResults.OPMD || 0) * 100,0),100)}%"></div></div>
            </div>
          </div>
          <div style="margin-top:8px;color:#9ca3af;font-size:10px;line-height:1.4;">调试信息：annotatedImage 原始='${deepDetectionResults.annotatedImage || ''}' | 解析='${deepAnnotatedImageAbsolute}'</div>
        `;
      }
      // 二分类模式
      if (diagnosisResponse?.data?.results) {
        const results: any = diagnosisResponse.data.results;
        const originalImageHtml = selectedImage ? `
          <div class="image-container">
            <img src="${selectedImage}" alt="原始上传图片" class="report-image" />
            <div class="image-caption">原始上传图片</div>
          </div>
        ` : '';
        let benignConfidence = 0.5;
        let opmdConfidence = 0.5;
        if (results.predicted_class && results.confidence !== undefined) {
          if (results.predicted_class === 'Benign') {
            benignConfidence = results.confidence;
            opmdConfidence = 1 - results.confidence;
          } else if (results.predicted_class === 'OPMD') {
            opmdConfidence = results.confidence;
            benignConfidence = 1 - results.confidence;
          }
        } else if (results.OPMD !== undefined) {
          opmdConfidence = results.OPMD;
          benignConfidence = 1 - opmdConfidence;
        }
        return `
          ${originalImageHtml}
          <div class="results-section">
            <div class="result-item">
              <div class="result-label">健康或其他良性疾病<br></div>
              <div class="result-value">${(benignConfidence * 100).toFixed(1)}%</div>
              <div class="confidence-bar"><div class="confidence-fill benign" style="width:${Math.min(Math.max(benignConfidence * 100,0),100)}%"></div></div>
            </div>
            <div class="result-item">
              <div class="result-label">恶性或潜在恶性疾病<br></div>
              <div class="result-value">${(opmdConfidence * 100).toFixed(1)}%</div>
              <div class="confidence-bar"><div class="confidence-fill opmd" style="width:${Math.min(Math.max(opmdConfidence * 100,0),100)}%"></div></div>
            </div>
          </div>
        `;
      }
      return '<div class="no-results">暂无检测结果</div>';
    })();

    const reportHTML = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI医学影像综合检测平台</title>
        <style>
          /* 紧凑版样式：字体≈原来的 75%，垂直间距≈原来的 50% */
          body {
            font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
            font-size: 12px; /* 默认 16 → 12 */
            line-height: 1.3; /* 1.6 → 1.3 */
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 12px; /* 20 → 12 */
            background-color: #fff;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 10px; /* 20 → 10 */
            margin-bottom: 15px; /* 30 → 15 */
          }
            .header h1 {
            color: #4f46e5;
            font-size: 18px; /* 24 → 18 */
            margin: 0;
            font-weight: bold;
          }
          .header p {
            color: #666;
            margin: 6px 0 0 0; /* 10 → 6 */
            font-size: 11px; /* 14 → 11 */
          }
          .section {
            margin-bottom: 12px; /* 25 → 12 */
            padding: 10px; /* 20 → 10 */
            border: 1px solid #e5e7eb;
            border-radius: 6px; /* 8 → 6 */
            background-color: #f9fafb;
          }
          .section h2 {
            color: #374151;
            font-size: 14px; /* 18 → 14 */
            margin: 0 0 8px 0; /* 15 → 8 */
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 4px; /* 8 → 4 */
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px; /* 15 → 8 */
            margin-bottom: 8px; /* 15 → 8 */
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 4px 0; /* 8 → 4 */
            border-bottom: 1px solid #e5e7eb;
          }
          .info-item:last-child { border-bottom: none; }
          .info-label {
            font-weight: 600;
            color: #374151;
            min-width: 80px; /* 100 → 80 */
            font-size: 11px; /* inherit smaller */
          }
          .info-value {
            color: #6b7280;
            text-align: right;
            flex: 1;
            word-wrap: break-word;
            font-size: 11px;
          }
          .diagnosis-content {
            background-color: #fff;
            padding: 8px; /* 15 → 8 */
            border-radius: 4px; /* 6 → 4 */
            border-left: 3px solid #4f46e5; /* 4px → 3px */
            margin-top: 5px; /* 10 → 5 */
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 11px;
            line-height: 1.35;
          }
          .footer {
            text-align: center;
            margin-top: 20px; /* 40 → 20 */
            padding-top: 10px; /* 20 → 10 */
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 9px; /* 12 → 9 */
            line-height: 1.25;
          }
          .results-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); /* narrower cards */
            gap: 8px; /* 15 → 8 */
            margin-top: 8px; /* 15 → 8 */
          }
          .result-item {
            background-color: #fff;
            padding: 8px; /* 15 → 8 */
            border-radius: 4px; /* 6 → 4 */
            border: 1px solid #e5e7eb;
            text-align: center;
          }
          .result-label {
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px; /* 8 → 4 */
            font-size: 11px; /* 14 → 11 */
            line-height: 1.25; /* 1.3 → 1.25 */
          }
          .result-value {
            font-size: 14px; /* 18 → 14 */
            font-weight: 600; /* bold but lighter visual */
            color: #4f46e5;
          }
          .confidence-bar {
            width: 100%;
            height: 6px; /* 8 → 6 */
            background-color: #e5e7eb;
            border-radius: 3px; /* 4 → 3 */
            margin-top: 4px; /* 8 → 4 */
            overflow: hidden;
          }
          .confidence-fill {
            height: 100%;
            border-radius: 3px; /* 4 → 3 */
            transition: width 0.3s ease;
          }
          .confidence-fill.benign { background-color: #10b981; }
          .confidence-fill.opmd { background-color: #ef4444; }
          .confidence-fill.olp { background-color: #3b82f6; }
          .confidence-fill.olk { background-color: #f59e0b; }
          .confidence-fill.osf { background-color: #8b5cf6; }
          .image-container {
            text-align: center;
            margin: 8px 0; /* 15 → 8 */
            padding: 6px; /* 10 → 6 */
            background-color: #fff;
            border-radius: 4px; /* 6 → 4 */
            border: 1px solid #e5e7eb;
          }
          .report-image {
            max-width: 100%;
            max-height: 200px; /* 300 → 200 */
            object-fit: contain;
            border-radius: 3px; /* 4 → 3 */
            border: 1px solid #d1d5db;
          }
          .image-caption {
            margin-top: 4px; /* 8 → 4 */
            font-size: 9px; /* 12 → 9 */
            color: #6b7280;
            font-style: italic;
            line-height: 1.2;
          }
          .no-results {
            text-align: center;
            color: #6b7280;
            font-style: italic;
            padding: 10px; /* 20 → 10 */
            font-size: 11px;
          }
          @media print {
            body { padding: 6px; } /* 再压缩打印边距 */
            .section { break-inside: avoid; }
            @page { margin: 0.6in; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>口腔黏膜潜在恶性疾病人工智能辅助筛查报告</h1>
          <p>生成时间：${currentDate}</p>
        </div>

        <div class="section">
          <h2>患者信息</h2>
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="info-label">患者姓名：</span>
                <span class="info-value">${patientData?.name || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">历史诊断：</span>
                <span class="info-value">${patientData?.history || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">主病案号：</span>
                <span class="info-value">${patientData?.index || 'N/A'}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">诊断时间：</span>
                <span class="info-value">${patientData?.date || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">活检确认：</span>
                <span class="info-value">${patientData?.biopsyConfirmed ? '已活检' : '未活检'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">诊断医师：</span>
                <span class="info-value">${patientData?.doctor || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 检测结果部分 暂时因为需求缘故注释掉，可以考虑日后开启-->
      <!--  <div class="section">  -->
       <!--   <h2>检测结果</h2>  -->
       <!--   ${detectionSectionHTML}  -->
        </div>

        <div class="section">
          <h2>辅助诊断结果</h2>
          <p>筛查项目：口腔黏膜潜在恶性疾病风险评估</p>

          <p>  筛查结果：${isDeepMode && deepDetectionResults?.finding ? deepDetectionResults.finding : finding || '无诊断结果'} </p>
        </div>

        <div class="section">
          <h2>诊断建议</h2>
          <div class="diagnosis-content">
            ${(() => {
              if (isDeepMode && deepDetectionResults?.reportRecommendation) {
                return deepDetectionResults.reportRecommendation;
              }
              const detailedRecommendation = diagnosisResponse?.data?.results?.reportRecommendation || recommendation;
              return detailedRecommendation || '无诊断建议';
            })()}
          </div>
        </div>

        <div class="footer">
          <p>本报告由口腔黏膜潜在恶性疾病自动化诊断平台生成</p>
          <p>仅供临床参考，不可替代专业医师诊断</p>
          <p>报告生成时间：${currentDate}</p>
        </div>
      </body>
      </html>
    `;

    return reportHTML;
  }, [patientData, diagnosisResponse, finding, recommendation, deepDetectionResults, selectedImage, isDeepMode]);

  // Handle download report
  const handleDownloadReport = useCallback(() => {
    try {
      const reportHTML = generateReportHTML();
      const blob = new Blob([reportHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with patient name and date
      const patientName = patientData?.name || '未知患者';
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `口腔诊断报告_${patientName}_${dateStr}.html`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('报告下载成功');
    } catch (error) {
      console.error('详细报告失败:', error);
      alert('报告下载失败，请重试');
    }
  }, [generateReportHTML, patientData?.name]);

  // Handle print report
  const handlePrintReport = useCallback(() => {
    try {
      const reportHTML = generateReportHTML();
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
      
      if (printWindow) {
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        
        // Wait for the content to load then print
        printWindow.onload = () => {
          // Small delay to ensure content is fully rendered
          setTimeout(() => {
            printWindow.print();
          }, 500);
          
          // Close the window after printing (optional)
          printWindow.onafterprint = () => {
            printWindow.close();
          };
        };
      } else {
        // Fallback: create a hidden iframe for printing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.left = '-500px';
        iframe.style.top = '-500px';
        document.body.appendChild(iframe);
        
        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.write(reportHTML);
          doc.close();
          
          iframe.onload = () => {
            setTimeout(() => {
              iframe.contentWindow?.print();
              
              // Clean up after a delay
              setTimeout(() => {
                if (document.body.contains(iframe)) {
                  document.body.removeChild(iframe);
                }
              }, 1000);
            }, 500);
          };
        }
      }
      
      console.log('报告打印请求已发送');
    } catch (error) {
      console.error('打印报告失败:', error);
      alert('报告打印失败，请重试');
    }
  }, [generateReportHTML]);

  return {
    handleDownloadReport,
    handlePrintReport
  };
};