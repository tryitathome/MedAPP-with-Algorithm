// src/services/diagnosis.service.ts
import { DiagnosisResult, CreateDiagnosisRequest, DiagnosisResponse } from '@shared/types';
import { supabase } from '../config/supabase';
import { DiagnosisInsert, DiagnosisRow } from '../types/database.types';
import { createError } from '../middleware/error.middleware';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

// Helper: Convert app DiagnosisResult to Supabase insert format
function toDbFormat(data: DiagnosisResult): DiagnosisInsert {
  return {
    patient_id: data.patientId,
    type: data.type as 'oral' | 'gastritis',
    image_url: data.imageUrl,
    confidence: data.results.confidence,
    finding: data.results.finding || '',
    recommendation: data.results.recommendation,
    severity: data.results.severity || null,
    report_recommendation: data.results.reportRecommendation || null,
    status_code: data.results.statusCode || null,
    olp_score: data.results.OLP || null,
    olk_score: data.results.OLK || null,
    ooml_score: data.results.OOML || null,
    opmd_score: data.results.OPMD || null,
    knowledge: data.results.knowledge || null,
    annotated_image_url: (data.results as any).annotatedImage || null,
    detections: (data.results as any).detections || null,
  };
}

// Helper: Convert Supabase row to app DiagnosisResult format
function fromDbFormat(row: DiagnosisRow): DiagnosisResult {
  return {
    _id: row.id,
    patientId: row.patient_id,
    type: row.type,
    imageUrl: row.image_url,
    results: {
      confidence: row.confidence,
      finding: row.finding,
      findings: [row.finding],
      recommendation: row.recommendation,
      severity: row.severity || undefined,
      reportRecommendation: row.report_recommendation || undefined,
      statusCode: row.status_code || undefined,
      OLP: row.olp_score || undefined,
      OLK: row.olk_score || undefined,
      OOML: row.ooml_score || undefined,
      OPMD: row.opmd_score || undefined,
      knowledge: row.knowledge || undefined,
      annotatedImage: row.annotated_image_url || undefined,
      detections: row.detections || undefined,
    },
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  } as DiagnosisResult;
}

const execAsync = promisify(exec);

export class DiagnosisService {
  async analyzeGastritis(diagnosisData: CreateDiagnosisRequest): Promise<DiagnosisResult> {
    try {
      const mockResult: DiagnosisResponse = {
        confidence: 0.85,
        findings: ['Mild gastritis detected', 'Inflammation in antrum region'],
        recommendation: 'Recommend follow-up with gastroenterologist',
        severity: 'medium'
      };

      const diagnosisPayload: DiagnosisResult = {
        patientId: diagnosisData.patientId,
        type: 'gastritis',
        imageUrl: diagnosisData.imageUrl || '/uploads/temp-image.jpg',
        results: mockResult
      };

      if (process.env.NO_DB === 'true') {
        return diagnosisPayload;
      }

      const { data, error } = await supabase
        .from('diagnoses')
        .insert(toDbFormat(diagnosisPayload) as any)
        .select()
        .single();

      if (error) throw error;
      return fromDbFormat(data as DiagnosisRow);
    } catch (error) {
      throw createError('Failed to analyze gastritis image', 500);
    }
  }

  async analyzeOral(diagnosisData: CreateDiagnosisRequest): Promise<DiagnosisResult> {
    try {
      // === 新的真实 AI 分析逻辑 ===
      console.log('Starting AI analysis for oral image...');
      console.log('Image URL:', diagnosisData.imageUrl);
      
      // 1. 从 imageUrl 提取文件名，并构建本地文件路径
      const imageUrl = diagnosisData.imageUrl || '';
      const filename = path.basename(imageUrl);
      const uploadsDir = path.join(__dirname, '../../uploads');
      const imagePath = path.join(uploadsDir, filename);
      
      console.log('Local image path:', imagePath);
      
      // 2. 构建 Python 脚本调用命令
        // 加载统一 Python 路径配置（避免硬编码）
      const { loadPythonPaths } = require('../config/python-paths');
      const pyCfg = loadPythonPaths();
      const pythonExecutable = pyCfg.classification;
      // Resolve MedAPP workspace root (../../../../../ from current file)
      const workspaceRoot = path.resolve(__dirname, '../../../../..');
      const scriptPath = path.join(workspaceRoot, 'Classify-LM-Simple-OralImages', 'classify_image.py');
      const command = `"${pythonExecutable}" "${scriptPath}" "${imagePath}"`;
      
      console.log('Executing command:', command);
      
      // 3. 执行 Python 脚本
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 30000, // 30秒超时
        cwd: workspaceRoot // 设置工作目录为 MedAPP 工作区根目录
      });
      
      if (stderr) {
        console.warn('Python script stderr:', stderr);
      }
      
      console.log('Python script stdout:', stdout);
      
      // 4. 解析 Python 脚本返回的 JSON 结果
      let aiResult;
      try {
        // 从输出中提取 JSON 部分（可能有其他日志信息）
        const lines = stdout.trim().split('\n');
        const jsonLine = lines.find(line => line.startsWith('{') && line.includes('predicted_class'));
        
        if (!jsonLine) {
          throw new Error('No valid JSON found in Python script output');
        }
        
        aiResult = JSON.parse(jsonLine);
        console.log('Parsed AI result:', aiResult);
      } catch (parseError) {
        console.error('Failed to parse Python script output:', parseError);
        throw new Error('Invalid response from AI analysis script');
      }
      
      // 5. 将 AI 结果转换为前端期望的格式
      const oralResults = this.convertAiResultToOralFormat(aiResult);
      
      // 6. 保存诊断结果到数据库
      // If NO_DB=true, return directly without DB persistence
      const aiFinding = this.generateFindingFromAiResult(aiResult);
      const { statusCode } = this.judgeStatusFromAi(aiResult);
      const texts = this.generateTextsByStatus(statusCode, aiResult.confidence);
      const resultPayload: DiagnosisResult = {
        patientId: diagnosisData.patientId,
        type: 'oral',
        imageUrl: diagnosisData.imageUrl || '/uploads/temp-image.jpg',
        results: {
          ...oralResults,
          confidence: aiResult.confidence,
          finding: texts.finding,
          findings: [texts.finding],
          recommendation: texts.recommendation,
          knowledge: texts.knowledge,
          reportRecommendation: texts.reportRecommendation,
          statusCode: statusCode as any,
          severity: this.calculateSeverityFromAiResult(aiResult)
        }
      };

      if (process.env.NO_DB === 'true') {
        return resultPayload;
      }

      const { data, error } = await supabase
        .from('diagnoses')
        .insert(toDbFormat(resultPayload) as any)
        .select()
        .single();

      if (error) throw error;
      return fromDbFormat(data as DiagnosisRow);
      
    } catch (error) {
      console.error('AI analysis error:', error);
      
      // === 备用方案：如果 AI 分析失败，回退到模拟数据 ===
      console.log('Falling back to mock data due to AI analysis error');
      
      // Removed artificial delay to speed up error fallback response

      // Generate mock oral-specific results (原有的模拟逻辑)
      const mockOralResults = this.generateMockOralResults();
      
      const fallbackFinding = this.generateFinding();
      const fallbackStatus = 'OPMD_SUSPECTED';
      const fallbackTexts = this.generateTextsByStatus(fallbackStatus, mockOralResults.OLK);
      const fallbackPayload: DiagnosisResult = {
        patientId: diagnosisData.patientId,
        type: 'oral',
        imageUrl: diagnosisData.imageUrl || '/uploads/temp-image.jpg',
        results: {
          ...mockOralResults,
          confidence: Math.max(mockOralResults.OLP, mockOralResults.OLK, mockOralResults.OOML),
      finding: fallbackTexts.finding,
      findings: [fallbackTexts.finding],
          recommendation: fallbackTexts.recommendation,
          knowledge: fallbackTexts.knowledge,
          reportRecommendation: fallbackTexts.reportRecommendation,
          statusCode: fallbackStatus,
          severity: this.calculateSeverity(mockOralResults)
        }
      };

      if (process.env.NO_DB === 'true') {
        return fallbackPayload;
      }

      const { data: fallbackData, error: fallbackError } = await supabase
        .from('diagnoses')
        .insert(toDbFormat(fallbackPayload) as any)
        .select()
        .single();

      if (fallbackError) throw fallbackError;
      return fromDbFormat(fallbackData as DiagnosisRow);
    }
  }

  async analyzeOralDummy(diagnosisData: CreateDiagnosisRequest): Promise<DiagnosisResult> {
    console.log('Using dummy oral analysis (Python AI disabled)');

    const mockOralResults = this.generateMockOralResults();
    const fallbackStatus = 'OPMD_SUSPECTED';
    const fallbackTexts = this.generateTextsByStatus(fallbackStatus, mockOralResults.OLK);
    const fallbackPayload: DiagnosisResult = {
      patientId: diagnosisData.patientId,
      type: 'oral',
      imageUrl: diagnosisData.imageUrl || '/uploads/temp-image.jpg',
      results: {
        ...mockOralResults,
        confidence: Math.max(mockOralResults.OLP, mockOralResults.OLK, mockOralResults.OOML),
        finding: fallbackTexts.finding,
        findings: [fallbackTexts.finding],
        recommendation: fallbackTexts.recommendation,
        knowledge: fallbackTexts.knowledge,
        reportRecommendation: fallbackTexts.reportRecommendation,
        statusCode: fallbackStatus,
        severity: this.calculateSeverity(mockOralResults)
      }
    };

    if (process.env.NO_DB === 'true') {
      return fallbackPayload;
    }

    const { data, error } = await supabase
      .from('diagnoses')
      .insert(toDbFormat(fallbackPayload) as any)
      .select()
      .single();

    if (error) throw error;
    return fromDbFormat(data as DiagnosisRow);
  }

  async analyzeOralDeep(diagnosisData: CreateDiagnosisRequest): Promise<DiagnosisResult> {
    try {
      const imageUrl = diagnosisData.imageUrl || '';
      const filename = path.basename(imageUrl);
      const uploadsDir = path.join(__dirname, '../../uploads');
      const imagePath = path.join(uploadsDir, filename);
      const workspaceRoot = path.resolve(__dirname, '../../../../..');

      // YOLO paths and params
  // 使用与二分类不同的独立 YOLO Python 解释器，通过统一配置加载（python-paths.ts）
        const { loadPythonPaths } = require('../config/python-paths');
        const pyCfg = loadPythonPaths();
        const pythonExecutable = pyCfg.yoloDetection || pyCfg.classification;

      // 运行前的存在性检查（尽量在抛出前给出清晰日志）
      const fs = require('fs');
      if (!fs.existsSync(pythonExecutable)) {
        console.error('[DeepDetection] 指定的 YOLO Python 可执行文件不存在:', pythonExecutable);
        throw createError(`YOLO Python 可执行文件不存在: ${pythonExecutable}`, 500);
      }
      if (!fs.existsSync(imagePath)) {
        console.error('[DeepDetection] 待检测图像不存在:', imagePath);
        throw createError(`待检测图像不存在: ${imagePath}`, 400);
      }
      const yoloScript = path.join(workspaceRoot, 'YOLO12-Simplified-OralImages', 'Yolo12Inference.py');
      const yoloModel = process.env.YOLO_MODEL_PATH || path.join(workspaceRoot, 'YOLO12-Simplified-OralImages', 'best_155epoch_shengkouV2.pt');
      const tempOutDir = path.join(uploadsDir, `deep_${Date.now()}`);

  const command = `"${pythonExecutable}" "${yoloScript}" --model "${yoloModel}" --source "${imagePath}" --output "${tempOutDir}" --conf 0.25 --line-thickness 6 --single-json`;
      console.log('[DeepDetection] Executing:', command);
      try {
        await execAsync(command, { cwd: workspaceRoot, timeout: 90000 });
      } catch (err: any) {
        console.error('[DeepDetection] 子进程执行失败');
        if (err?.stderr?.includes("No module named 'ultralytics'")) {
          console.error('[DeepDetection] 未检测到 ultralytics，请确认在 YOLO 专用 Python 环境中已安装: pip install ultralytics');
        }
        throw createError('Deep detection YOLO 调用失败: ' + (err?.stderr || err?.message), 500);
      }

      // 解析单图结果：优先 single_result.json，其次 JSONL 第一行
      const fs2 = require('fs');
      let record: any = null;
      const singleJsonPath = path.join(tempOutDir, 'single_result.json');
      if (fs2.existsSync(singleJsonPath)) {
        try {
          record = JSON.parse(fs2.readFileSync(singleJsonPath, 'utf-8'));
        } catch (e) {
          console.error('[DeepDetection] single_result.json 解析失败', e);
        }
      }
      if (!record) {
        const jsonlPath = path.join(tempOutDir, 'inference_results.jsonl');
        if (!fs2.existsSync(jsonlPath)) {
          throw createError('未找到 YOLO 输出文件 (inference_results.jsonl)', 500);
        }
        const raw = fs2.readFileSync(jsonlPath, 'utf-8').trim();
        if (!raw) {
          throw createError('YOLO 输出 JSONL 为空 (可能是未检测或脚本异常)', 500);
        }
        const firstLine = raw.split('\n')[0];
        try {
          record = JSON.parse(firstLine);
        } catch (e) {
          console.error('[DeepDetection] JSONL 解析失败', e, '内容:', firstLine);
          throw createError('解析 YOLO JSON 结果失败', 500);
        }
      }

      // Map classes: we assume class names OLP, OLK, OSF (case-insensitive)
      const perClassMax: Record<string, number> = { OLP: 0, OLK: 0, OSF: 0 };
      for (const det of record.detections) {
        const name = String(det.class_name).toUpperCase();
        if (perClassMax[name] !== undefined) {
          perClassMax[name] = Math.max(perClassMax[name], det.confidence);
        }
      }

  const visRel = record.vis_image; // relative to tempOutDir
  // 直接使用临时目录中的可视化结果（避免复制 & 命名差异导致 404）
  const annotatedImageUrl = `/uploads/${path.basename(tempOutDir)}/${visRel.replace(/\\/g, '/')}`;

      const deepResults = {
        OLP: perClassMax.OLP || 0,
        OLK: perClassMax.OLK || 0,
        OSF: perClassMax.OSF || 0
      };

      // 计算综合 OPMD (可调整策略：这里取三类最大值)
      const opmdScore = Math.max(deepResults.OLP, deepResults.OLK, deepResults.OSF);

  const { statusCode } = this.judgeStatusFromDeep({ ...deepResults, OPMD: opmdScore });
  const deepTexts = this.generateTextsByStatus(statusCode, record.top_confidence);
  const finding = deepTexts.finding;

      const payload: DiagnosisResult = {
        patientId: diagnosisData.patientId,
        type: 'oral-deep',
        imageUrl: diagnosisData.imageUrl || '/uploads/temp-image.jpg',
        results: {
          // reuse oral format keys for compatibility + add OSF via spread if TS model supports
          OLP: deepResults.OLP,
          OLK: deepResults.OLK,
          OSF: deepResults.OSF, // 显式包含
          OPMD: opmdScore,
          confidence: record.top_confidence,
          finding,
          findings: [finding],
          recommendation: deepTexts.recommendation,
          knowledge: deepTexts.knowledge,
          reportRecommendation: deepTexts.reportRecommendation,
          statusCode: statusCode as any,
          severity: record.top_confidence >= 0.8 ? 'high' : (record.top_confidence >= 0.6 ? 'medium' : 'low'),
          // detections & annotated image 已在下方追加
          // @ts-ignore - return annotated image URL
          annotatedImage: annotatedImageUrl,
          // @ts-ignore - raw detections
          detections: record.detections
        }
      } as any;

      if (process.env.NO_DB === 'true') {
        return payload;
      }

      const { data: deepData, error: deepError } = await supabase
        .from('diagnoses')
        .insert(toDbFormat(payload) as any)
        .select()
        .single();

      if (deepError) throw deepError;
      return fromDbFormat(deepData as DiagnosisRow);
    } catch (e) {
      console.error('[DeepDetection] error', e);
      throw createError('Deep detection failed', 500);
    }
  }

  private generateMockOralResults(): { OLP: number; OLK: number; OOML: number } {
    // Base values with some randomness
    const baseValues = {
      OLP: 0.184,
      OLK: 0.651,
      OOML: 0.121
    };
    
    const variation = 0.15; // 15% variation
    
    return {
      OLP: Math.max(0.01, Math.min(0.99, baseValues.OLP + (Math.random() - 0.5) * variation)),
      OLK: Math.max(0.01, Math.min(0.99, baseValues.OLK + (Math.random() - 0.5) * variation)),
      OOML: Math.max(0.01, Math.min(0.99, baseValues.OOML + (Math.random() - 0.5) * variation))
    };
  }

  private generateFinding(): string {
    const finding = "口腔白斑病 待排"; // Placeholder for actual finding logic
    return finding;
  }

  private generateRecommendation(): string {
    const recommendation = `经AI辅助系统诊断，该患者可能患有口腔白斑病。口腔白斑病不是癌症，但是有一定的癌变风险，建议前往专业口腔黏膜科室接受进一步诊断，提高警惕，严密观察，并必要时可进行多次组织活检。\n口腔白斑病治疗第一步是去除任何可能的刺激因素，去除残根、残冠及不良修复体，纠正不良生活习惯。例如戒烟戒酒，不吃刺激食品和过烫、粗糙食物等，然后根据不同的病情决定用药还是采用其他治疗方案。定期随访是非常重要的，如果观察到白斑增厚、变硬、出现溃疡等的时候，应及时手术切除。`; // Placeholder for actual recommendation logic
    return recommendation;
  }

  private generateKnowledge(): string {
  // 占位：默认知识宣讲（未区分）——实际使用新的分支函数 generateTextsByStatus
  return '（占位）通用医学知识内容';
  }

  private calculateSeverity(results: { OLP: number; OLK: number; OOML: number }): 'low' | 'medium' | 'high' {
    const maxValue = Math.max(results.OLP, results.OLK, results.OOML);
    
    if (maxValue >= 0.7) return 'high';
    if (maxValue >= 0.4) return 'medium';
    return 'low';
  }

  // === 新增的 AI 结果处理方法 ===

  /**
   * 将 AI 分析结果转换为前端期望的 OLP/OLK/OOML 格式
   */
  private convertAiResultToOralFormat(aiResult: { predicted_class: string; confidence: number }): { OLP: number; OLK: number; OPMD: number } {
    // 根据 AI 预测的类别，设置相应的置信度
    const confidence = aiResult.confidence;
    const predictedClass = aiResult.predicted_class;
    
    // 初始化所有类别为较低的基准值
    let results = {
      OLP: 0.0,   // 将 OLP 置零以验证真实对接
      OLK: 0.0,   // 将 OLK 置零以验证真实对接
      OPMD: 0.0   // 新字段，映射为 AI 返回的总置信度
    };
    
    // 根据预测类别设置主要置信度
    switch (predictedClass) {
      case 'OPMD':
        // 直接将 AI 置信度映射到 OPMD，OLP/OLK 保持为 0
        results.OPMD = confidence;
        break;
      case 'Benign':
        // 正常情况下，所有疾病类别都应该有较低的置信度
  results.OPMD = Math.max(0.01, (1 - confidence));
        break;
      default:
        // 未知类别，使用默认分布
  results.OPMD = confidence;
        break;
    }
    
    // 确保所有值在有效范围内
  results.OPMD = Math.max(0.01, Math.min(0.99, results.OPMD));
    
    console.log('Converted AI result to oral format:', results);
    return results;
  }

  /**
   * 根据 AI 结果生成诊断发现
   */
  private generateFindingFromAiResult(aiResult: { predicted_class: string; confidence: number }): string {
  // 保留旧逻辑入口，但将调用统一的新分支逻辑
  const { statusCode } = this.judgeStatusFromAi(aiResult);
  const texts = this.generateTextsByStatus(statusCode, aiResult.confidence);
  return texts.finding;
  }

  /**
   * 根据 AI 结果生成治疗建议
   */
  private generateRecommendationFromAiResult(aiResult: { predicted_class: string; confidence: number }): string {
  const { statusCode } = this.judgeStatusFromAi(aiResult);
  const texts = this.generateTextsByStatus(statusCode, aiResult.confidence);
  return texts.recommendation;
  }

  /**
   * 根据 AI 结果计算严重程度
   */
  private calculateSeverityFromAiResult(aiResult: { predicted_class: string; confidence: number }): 'low' | 'medium' | 'high' {
    const confidence = aiResult.confidence;
    const predictedClass = aiResult.predicted_class;
    
    if (predictedClass === 'OPMD') {
      if (confidence >= 0.9) return 'high';
      if (confidence >= 0.6) return 'medium';
      return 'medium'; // OPMD 即使置信度不高也应该是中等严重程度
    } else if (predictedClass === 'Benign') {
      return 'low';
    } else {
      if (confidence >= 0.7) return 'medium';
      return 'low';
    }
  }

  // === 统一的六种状态分支逻辑 ===
  private judgeStatusFromAi(aiResult: { predicted_class: string; confidence: number }): { statusCode: string } {
    const { predicted_class, confidence } = aiResult;
    // 仅二分类阶段：OPMD 阳性 / 疑似阳性 / 阴性
    if (predicted_class === 'OPMD') {
      if (confidence >= 0.8) return { statusCode: 'OPMD_POSITIVE' };
      if (confidence >= 0.4) return { statusCode: 'OPMD_SUSPECTED' };
      return { statusCode: 'OPMD_NEGATIVE' }; // 低置信度时仍给出阴性待排
    }
    if (predicted_class === 'Benign') {
      if (confidence <= 0.6) return { statusCode: 'OPMD_SUSPECTED' };
      return { statusCode: 'OPMD_NEGATIVE' };
    }
    // 兼容旧三输出：OLP / OLK / OOML => 转入对应深度阶段（此处直接映射为多分类阳性）
    const upper = predicted_class.toUpperCase();
    if (['OLP', 'OLK', 'OSF'].includes(upper)) {
      return { statusCode: `${upper}_POSITIVE` } as any;
    }
    // 兜底：按疑似 OPMD 处理
    return { statusCode: 'OPMD_SUSPECTED' };
  }

  private generateTextsByStatus(statusCode: string, confidence?: number): { finding: string; knowledge: string; recommendation: string; reportRecommendation: string } {
    const cText ='';//confidence !== undefined ? `（置信度 ${(confidence * 100).toFixed(1)}%）` : ''; #如果需要显示置信度则启用
    switch (statusCode) {
      // 1. OPMD 阳性待排
      case 'OPMD_POSITIVE':
        return {
          finding: `潜在恶性疾病阳性待排${cText}`,
          knowledge: '# 口腔黏膜潜在恶性疾病阳性？科学认知与管理指南\n\n## 一、正确理解“口腔黏膜潜在恶性疾病”\n\n“潜在恶性疾病”听起来可能有些令人紧张，但请正确理解：它**不是癌症**，而是指一类发生于口腔黏膜的、有更高癌变风险的病变。它们是身体发出的“警示信号”，提醒我们需要比以往更加关注口腔健康。只要我们给予足够的重视，通过科学的监测和及时的干预，绝大多数病变都可以得到有效控制，癌变的风险也能被降到最低。\n\n口腔黏膜潜在恶性疾病包括：口腔白斑，增殖性疣状白斑，口腔红斑，口腔黏膜下纤维性变，口腔扁平苔藓，光化性唇炎，倒吸烟相关腭部病损，口腔红斑狼疮，先天性角化异常，口腔苔藓样病变，口腔移植物抗宿主病。\n\n## 二、需要警惕的“警示信号”：哪些迹象需及时就医？\n\n当您的口腔内出现以下任何一种情况，且持续存在超过2-4周未能自行愈合时，都应及时就医检查：\n\n（1）颜色异常：出现无法擦掉的白色斑块（白斑）、鲜红色斑块（红斑）或红白相间的斑块。\n\n（2）质地改变：黏膜表面变得粗糙、增厚、变硬，或出现像菜花、桑葚一样的疣状增生。\n\n（3）长期不愈的溃疡：任何部位出现的固定、边缘不清晰、基底发硬的溃疡或糜烂。\n\n（4）功能障碍：无明显原因地出现进行性的张口困难、舌头活动不灵、吞咽或说话困难。\n\n（5）异常感觉：口腔内出现反复的烧灼感、麻木感、干燥感或不明原因的疼痛。\n\n## 三、致病原因与高危因素\n\n（1）烟草与酒精：长期、大量的吸烟和饮酒是诱发多种口腔黏膜病变及口腔癌的**头号元凶**。\n\n（2）咀嚼槟榔：这是导致“口腔黏膜下纤维化”的**最主要原因**，具有极强的致病性和致癌性。\n\n（3）局部慢性刺激：尖锐的牙尖、牙齿残根、不合适的假牙或修复体长期摩擦口腔黏膜。\n\n（4）不良饮食习惯：长期偏爱过烫、辛辣刺激的食物。\n\n（5）病毒感染：特定亚型的人乳头瘤病毒（HPV）感染与某些病变的发生有关。\n\n（6）其他因素：包括营养不良（如缺乏维生素A、B族）、免疫功能紊乱、遗传易感性、过度日光照射（与唇部病变相关）等。\n\n## 四、诊断与治疗方式\n\n## 诊断金标准——病理活检\n\n对于可疑的病变，医生通常会取一小块组织（约绿豆大小）进行病理学检查。这是判断病变良恶性、有无癌变倾向的**唯一可靠方法**。请不要惧怕活检，它是一个简单、安全且至关重要的步骤。\n\n## 治疗核心原则——个体化与系统化\n\n（1）去除病因是第一步：立即戒烟、戒酒、戒槟榔，调整或去除口腔内一切不良刺激物。这是所有治疗的基础。\n\n（2）定期随访是基石：对于低风险的病变，最重要的“治疗”就是遵医嘱定期复查（通常为3-6个月或1年）。医生会严密监测病变的变化。\n\n（3）积极干预是手段：对于经活检证实有中、重度不典型增生（即癌变风险较高）的病变，医生会根据具体情况，采取药物、激光、冷冻或手术切除等方式进行干预。\n\n## 五、患者的自我管理与配合\n\n管理口腔黏膜潜在恶性疾病，是一场需要您深度参与的“持久战”。您的积极配合至关重要：\n\n（1）坚决戒除不良习惯：这是您可以为自己做的**最重要的一件事**。\n\n（2）养成自我检查习惯：每月一次，在光线充足的地方，用镜子仔细检查自己的口腔（包括唇、颊、舌、上颚、口底等所有角落），留意任何新出现的变化。\n\n（3）保持良好口腔卫生：使用软毛牙刷，温和刷牙，餐后漱口。\n\n（4）调整生活方式：均衡饮食，多吃新鲜蔬果，保证充足睡眠，适度锻炼，保持乐观心态，减轻精神压力。\n\n（5）绝对不要错过任何一次复查：请将复查日期标记在日历上。您的坚持，是对自己健康的最大负责。\n\n请记住，发现潜在恶性疾病并不可怕，可怕的是忽视与拖延。让我们医患携手，科学管理，防患于未然，共同守护您的口腔与全身健康！',
          recommendation: '系统在您提交的照片中发现了一些与潜在健康风险有关的特征，需要由经验更丰富的口腔黏膜专科医生为您做一次更深入、更全面的检查来确认。建议您尽快预约三甲医院或口腔专科医院的“口腔黏膜科”或“口腔内科”，寻求专业帮助，保障口腔健康。\n\n本AI筛查结果仅为辅助诊断参考，不能取代执业医师的专业诊断。',
          reportRecommendation: '尽快预约专科门诊：请您尽快预约三甲医院或口腔专科医院的“口腔黏膜科”或“口腔内科”。\n\n 保持积极心态：请不要过分紧张或焦虑。早期发现并寻求专业帮助，是保障口腔健康最好的方式。在专科医生给出明确诊断前，请保持正常生活，但建议暂停吸烟、饮酒等不良习惯。\n\n请注意：本筛查旨在提高潜在风险病变的检出率，需与临床诊断结合进行综合评估。'
        };

      // 2. OPMD 疑似阳性待排
      case 'OPMD_SUSPECTED':
        return {
          finding: `潜在恶性疾病疑似阳性待排${cText}`,
          knowledge: '# 口腔黏膜潜在恶性疾病疑似阳性？科学认知与管理指南\n\n## 一、正确理解“口腔黏膜潜在恶性疾病”\n\n“潜在恶性疾病”听起来可能有些令人紧张，但请正确理解：它**不是癌症**，而是指一类发生于口腔黏膜的、有更高癌变风险的病变。它们是身体发出的“警示信号”，提醒我们需要比以往更加关注口腔健康。只要我们给予足够的重视，通过科学的监测和及时的干预，绝大多数病变都可以得到有效控制，癌变的风险也能被降到最低。\n\n口腔黏膜潜在恶性疾病包括：口腔白斑，增殖性疣状白斑，口腔红斑，口腔黏膜下纤维性变，口腔扁平苔藓，光化性唇炎，倒吸烟相关腭部病损，口腔红斑狼疮，先天性角化异常，口腔苔藓样病变，口腔移植物抗宿主病。\n\n## 二、需要警惕的“警示信号”：哪些迹象需及时就医？\n\n当您的口腔内出现以下任何一种情况，且持续存在超过2-4周未能自行愈合时，都应及时就医检查：\n\n（1）颜色异常：出现无法擦掉的白色斑块（白斑）、鲜红色斑块（红斑）或红白相间的斑块。\n\n（2）质地改变：黏膜表面变得粗糙、增厚、变硬，或出现像菜花、桑葚一样的疣状增生。\n\n（3）长期不愈的溃疡：任何部位出现的固定、边缘不清晰、基底发硬的溃疡或糜烂。\n\n（4）功能障碍：无明显原因地出现进行性的张口困难、舌头活动不灵、吞咽或说话困难。\n\n（5）异常感觉：口腔内出现反复的烧灼感、麻木感、干燥感或不明原因的疼痛。\n\n## 三、致病原因与高危因素\n\n（1）烟草与酒精：长期、大量的吸烟和饮酒是诱发多种口腔黏膜病变及口腔癌的**头号元凶**。\n\n（2）咀嚼槟榔：这是导致“口腔黏膜下纤维化”的**最主要原因**，具有极强的致病性和致癌性。\n\n（3）局部慢性刺激：尖锐的牙尖、牙齿残根、不合适的假牙或修复体长期摩擦口腔黏膜。\n\n（4）不良饮食习惯：长期偏爱过烫、辛辣刺激的食物。\n\n（5）病毒感染：特定亚型的人乳头瘤病毒（HPV）感染与某些病变的发生有关。\n\n（6）其他因素：包括营养不良（如缺乏维生素A、B族）、免疫功能紊乱、遗传易感性、过度日光照射（与唇部病变相关）等。\n\n## 四、诊断与治疗方式\n\n## 诊断金标准——病理活检\n\n对于可疑的病变，医生通常会取一小块组织（约绿豆大小）进行病理学检查。这是判断病变良恶性、有无癌变倾向的**唯一可靠方法**。请不要惧怕活检，它是一个简单、安全且至关重要的步骤。\n\n## 治疗核心原则——个体化与系统化\n\n（1）去除病因是第一步：立即戒烟、戒酒、戒槟榔，调整或去除口腔内一切不良刺激物。这是所有治疗的基础。\n\n（2）定期随访是基石：对于低风险的病变，最重要的“治疗”就是遵医嘱定期复查（通常为3-6个月或1年）。医生会严密监测病变的变化。\n\n（3）积极干预是手段：对于经活检证实有中、重度不典型增生（即癌变风险较高）的病变，医生会根据具体情况，采取药物、激光、冷冻或手术切除等方式进行干预。\n\n## 五、患者的自我管理与配合\n\n管理口腔黏膜潜在恶性疾病，是一场需要您深度参与的“持久战”。您的积极配合至关重要：\n\n（1）坚决戒除不良习惯：这是您可以为自己做的**最重要的一件事**。\n\n（2）养成自我检查习惯：每月一次，在光线充足的地方，用镜子仔细检查自己的口腔（包括唇、颊、舌、上颚、口底等所有角落），留意任何新出现的变化。\n\n（3）保持良好口腔卫生：使用软毛牙刷，温和刷牙，餐后漱口。\n\n（4）调整生活方式：均衡饮食，多吃新鲜蔬果，保证充足睡眠，适度锻炼，保持乐观心态，减轻精神压力。\n\n（5）绝对不要错过任何一次复查：请将复查日期标记在日历上。您的坚持，是对自己健康的最大负责。\n\n请记住，发现潜在恶性疾病并不可怕，可怕的是忽视与拖延。让我们医患携手，科学管理，防患于未然，共同守护您的口腔与全身健康！',
          recommendation: '系统在您提交的照片中发现了可能与潜在健康风险有关的特征，需要由经验更丰富的口腔黏膜专科医生进一步确认。建议您尽快预约三甲医院或口腔专科医院的“口腔黏膜科”或“口腔内科”，寻求专业帮助，保障口腔健康。\n\n本AI筛查结果仅为辅助诊断参考，不能取代执业医师的专业诊断。',
          reportRecommendation: '尽快预约专科门诊：请您尽快预约三甲医院或口腔专科医院的“口腔黏膜科”或“口腔内科”。\n\n 保持积极心态：请不要过分紧张或焦虑。早期发现并寻求专业帮助，是保障口腔健康最好的方式。在专科医生给出明确诊断前，请保持正常生活，但建议暂停吸烟、饮酒等不良习惯。\n\n请注意：本筛查旨在提高潜在风险病变的检出率，需与临床诊断结合进行综合评估。'
        };
      // 3. OPMD 阴性待排
      case 'OPMD_NEGATIVE':
        return {
          finding: `潜在恶性疾病阴性待排${cText}`,
          knowledge: '# 口腔黏膜潜在恶性疾病阴性？科学认知与管理指南\n\n## 一、正确理解“口腔黏膜潜在恶性疾病”\n\n“潜在恶性疾病”听起来可能有些令人紧张，但请正确理解：它**不是癌症**，而是指一类发生于口腔黏膜的、有更高癌变风险的病变。它们是身体发出的“警示信号”，提醒我们需要比以往更加关注口腔健康。只要我们给予足够的重视，通过科学的监测和及时的干预，绝大多数病变都可以得到有效控制，癌变的风险也能被降到最低。\n\n口腔黏膜潜在恶性疾病包括：口腔白斑，增殖性疣状白斑，口腔红斑，口腔黏膜下纤维性变，口腔扁平苔藓，光化性唇炎，倒吸烟相关腭部病损，口腔红斑狼疮，先天性角化异常，口腔苔藓样病变，口腔移植物抗宿主病。\n\n## 二、需要警惕的“警示信号”：哪些迹象需及时就医？\n\n当您的口腔内出现以下任何一种情况，且持续存在超过2-4周未能自行愈合时，都应及时就医检查：\n\n（1）颜色异常：出现无法擦掉的白色斑块（白斑）、鲜红色斑块（红斑）或红白相间的斑块。\n\n（2）质地改变：黏膜表面变得粗糙、增厚、变硬，或出现像菜花、桑葚一样的疣状增生。\n\n（3）长期不愈的溃疡：任何部位出现的固定、边缘不清晰、基底发硬的溃疡或糜烂。\n\n（4）功能障碍：无明显原因地出现进行性的张口困难、舌头活动不灵、吞咽或说话困难。\n\n（5）异常感觉：口腔内出现反复的烧灼感、麻木感、干燥感或不明原因的疼痛。\n\n## 三、致病原因与高危因素\n\n（1）烟草与酒精：长期、大量的吸烟和饮酒是诱发多种口腔黏膜病变及口腔癌的**头号元凶**。\n\n（2）咀嚼槟榔：这是导致“口腔黏膜下纤维化”的**最主要原因**，具有极强的致病性和致癌性。\n\n（3）局部慢性刺激：尖锐的牙尖、牙齿残根、不合适的假牙或修复体长期摩擦口腔黏膜。\n\n（4）不良饮食习惯：长期偏爱过烫、辛辣刺激的食物。\n\n（5）病毒感染：特定亚型的人乳头瘤病毒（HPV）感染与某些病变的发生有关。\n\n（6）其他因素：包括营养不良（如缺乏维生素A、B族）、免疫功能紊乱、遗传易感性、过度日光照射（与唇部病变相关）等。\n\n## 四、诊断与治疗方式\n\n## 诊断金标准——病理活检\n\n对于可疑的病变，医生通常会取一小块组织（约绿豆大小）进行病理学检查。这是判断病变良恶性、有无癌变倾向的**唯一可靠方法**。请不要惧怕活检，它是一个简单、安全且至关重要的步骤。\n\n## 治疗核心原则——个体化与系统化\n\n（1）去除病因是第一步：立即戒烟、戒酒、戒槟榔，调整或去除口腔内一切不良刺激物。这是所有治疗的基础。\n\n（2）定期随访是基石：对于低风险的病变，最重要的“治疗”就是遵医嘱定期复查（通常为3-6个月或1年）。医生会严密监测病变的变化。\n\n（3）积极干预是手段：对于经活检证实有中、重度不典型增生（即癌变风险较高）的病变，医生会根据具体情况，采取药物、激光、冷冻或手术切除等方式进行干预。\n\n## 五、患者的自我管理与配合\n\n管理口腔黏膜潜在恶性疾病，是一场需要您深度参与的“持久战”。您的积极配合至关重要：\n\n（1）坚决戒除不良习惯：这是您可以为自己做的**最重要的一件事**。\n\n（2）养成自我检查习惯：每月一次，在光线充足的地方，用镜子仔细检查自己的口腔（包括唇、颊、舌、上颚、口底等所有角落），留意任何新出现的变化。\n\n（3）保持良好口腔卫生：使用软毛牙刷，温和刷牙，餐后漱口。\n\n（4）调整生活方式：均衡饮食，多吃新鲜蔬果，保证充足睡眠，适度锻炼，保持乐观心态，减轻精神压力。\n\n（5）绝对不要错过任何一次复查：请将复查日期标记在日历上。您的坚持，是对自己健康的最大负责。\n\n请记住，发现潜在恶性疾病并不可怕，可怕的是忽视与拖延。让我们医患携手，科学管理，防患于未然，共同守护您的口腔与全身健康！',
          recommendation: '系统未在您提交的口腔图片中发现与口腔黏膜潜在恶性疾病的明显迹象。希望您保持健康生活习惯，定期进行专业检查。\n\n本AI筛查结果仅为辅助诊断参考，不能取代执业医师的专业诊断。',
          reportRecommendation: '保持良好习惯：保持健康的生活方式，如戒烟、限酒、不嚼槟榔，避免过烫过辣的饮食。\n\n定期自我检查：定期观察自己的口腔内部，注意有无出现白斑、红斑、不明原因的破溃等情况。\n\n定期专业检查：每年进行一次全面的口腔检查。任何微小的变化，医生都能比您更早发现。\n\n请注意：本筛查旨在提高潜在风险病变的检出率，需与临床诊断结合进行综合评估。'
        };
      // 4. OLK 阳性待排
      case 'OLK_POSITIVE':
        return {
          finding: `口腔白斑病（OLK） 阳性待排${cText}`,
            knowledge: '# 口腔白斑健康教育\n\n说起“口腔白斑”，很多患者朋友们往往会顾名思义，认为凡是发生在口腔粘膜上的白色斑块都是白斑，一旦发生白斑就会有恶变的可能，其实这种理解是不对的，**口腔白斑病人约3%---5%会发生癌变**。2005年WHO将口腔白斑归为癌前病变，“癌前病变”不是“癌”，只因为口腔白斑病理表现为上皮异常增生，所以癌变机率高于正常上皮组织。口腔粘膜白斑可表现为五种形态特征：斑块状、皱纹纸状、颗粒状、疣状、溃疡状，前两类为均质型，后三类为非均质型，**非均质型癌变几率大于均质型**。国内研究显示，**女性患者白斑的危险性是男性的2.49倍**，**舌部及口底白斑危险性高于其他部位**，**疣状白斑的危险性是均质型白斑的10倍**。根据口腔病理改变，口腔粘膜白斑分为轻、中、重度异常增生，**中度异常增生白斑的危险性是单纯增生或轻度异常增生性白斑的276.48倍**，**重度异常增生白斑癌变风险是单纯增生或轻度异常增生性白斑的499.55倍**。\n\n# 口腔白斑癌变倾向较高的情况\n有以下情况的口腔白斑患者癌变倾向较大，应该提高警惕，严密观察，必要时可进行多次组织活检：\n（1）年龄：年龄较大，如60岁以上者；\n（2）性别：不吸烟的女性，特别是年轻女性患者，这种特发性白斑恶变可能性大；\n（3）吸烟：吸烟时间长，烟量大（如吸烟年数×每天支数>400)者；\n（4）部位：舌缘、舌腹、口底及口角部位；\n（5）类型：疣状，颗粒型，溃疡或糜烂型及伴有念珠菌感染者；\n（6）病理：伴有上皮异常增生者，程度越重越易恶变；\n（7）时间：病变时间较长者；\n（8）症状：有刺激性痛或自发痛者。\n\n# 口腔白斑的发病原因\n为什么会生口腔白斑？具体原因如下：\n（1）吸烟等理化刺激：与白斑的发生密切相关，白斑的发生率与吸烟时间的长短及吸烟量呈正比关系。发病部位与烟接触口腔的方式、烟雾刺激的部位有关。吸烟对口腔黏膜可以产生物理、化学刺激引起口腔黏膜的病理性变化。吸烟时产生的高温对口腔有灼伤作用，引起局部黏膜充血、水肿，同时烟和烟燃烧时产生的烟雾中含有尼古丁、焦油、二苯蒽等致癌物质。这些有害的物质可直接进入口腔黏膜上皮，破坏黏膜上皮，通过长期慢性刺激，使局部形成一种慢性炎症过程，机体产生一种防御性的增生反应；\n（2）局部刺激：饮酒、进食过烫或酸辣食物、嚼槟榔等均与白斑形成相关。食用刺激性食物如烫、辣、硬食会使上消化道黏膜组织发生不同程度的损伤，轻者导致黏膜充血、水肿、变性、渗出，形成炎症，重者组织细胞坏死、脱落形成糜烂和浅表溃疡，继而上皮修复增生、过度增生而发生黏膜白斑；\n（3）白色念珠菌感染：与白斑有密切关系，据国内学者调查，我国口腔白斑患者中，白色念珠菌阳性率为34%左右。用白色念珠菌感染动物可制备白斑动物模型，显示白色念珠菌可能是白斑发生的一个重要致病因素或是其中的一种合并因素。临床表明，伴有白色念珠菌感染的白斑——“白念白斑”容易发生恶性病变；\n（4）全身因素：包括微量元素、微循环改变、易感的遗传素质、脂溶性维生素缺乏等；\n（5）中医观点：中医认为口腔黏膜与病人全身因素，特别是气血循环障碍有很大关系。一些患者用中药活血化瘀治疗取得较好的效果就是一个例证；\n（6）其他相关因素：迄今为止，对口腔白斑癌变的发病原因尚不明确，但普遍认为白斑癌变与理化因素长期作用、致癌剂损伤、遗传物质以及免疫功能不全有关。近来研究表明，白斑的发生与人类乳头状瘤病毒(HPV)的感染有密切关系。在口腔黏膜白斑中发现有可诱发癌变的HPV16感染；同时，中医还认为，肺胃积热、外感毒邪，内外合邪，熏蒸于上或下流注而发本病。\n\n# 口腔白斑的治疗方法\n\n ## 常规治疗 \n\n治疗第一步是去除任何可能的刺激因素，去除残根、残冠及不良修复体，纠正不良生活习惯。例如戒烟戒酒，不吃刺激食品和过烫、粗糙食物等。然后根据不同的病情决定用药还是采用激光、冷冻、微波等其他治疗方案。**定期随访是非常重要的**，如果观察到白斑增厚、变硬、出现溃疡等的时候，应及时手术切除。对于癌变危险性高的，我们也要及时切除活检。\n\n ## 中医治疗 \n\n对白斑进行中医分型辩证施治也是一种治疗方法，但是同样做不到根治。比如痰湿凝聚型的白斑给予健脾化湿消斑；气血亏虚型的给予补气益血祛斑；瘀血内阻型的给予活血化瘀化斑。祖国的医学文献中有不少可以用于治疗口腔黏膜病的“经方”，但是没有“一方特治一病”的记载。目前我们通过发掘中医药古方和总结临床经验相结合，形成了一些相对固定的方剂和制剂，例如复方绞股蓝胶囊、五白方、双花方等，经过辩证用于某些口腔黏膜病，有一定的疗效，但是不能称之为特效药。',
            recommendation: 'AI系统检测出口腔白斑病。口腔白斑病是一种发生在口腔黏膜上的、不能被擦去的、白色斑块或斑片。口腔白斑病的癌变风险与其临床类型及病理分级密切相关。非均质型（如颗粒状、疣状、溃疡状）的风险通常高于均质型。建议尽快就诊口腔黏膜专科/口腔内科，医生可能建议进行真菌学评估、去除刺激因素，并在评估后进行组织病理学活检以明确分型与风险。',
            reportRecommendation: '尽快预约专科门诊：请您尽快预约三甲医院或口腔专科医院的“口腔黏膜科”或“口腔内科”。\n\n 保持积极心态：请不要过分紧张或焦虑。早期发现并寻求专业帮助，是保障口腔健康最好的方式。在专科医生给出明确诊断前，请保持正常生活，但建议暂停吸烟、饮酒等不良习惯。\n\n请注意：本筛查旨在提高潜在风险病变的检出率，需与临床诊断结合进行综合评估。'
        };
      // 5. OLP 阳性待排
      case 'OLP_POSITIVE':
        return {
          finding: `口腔扁平苔藓（OLP） 阳性待排${cText}`,
            knowledge: '# 口腔扁平苔藓健康教育\n\n口腔扁平苔藓是口腔黏膜病种仅次于复发性阿弗他溃疡的常见良性疾病，其患病率约0.1%—4%。该病好发于中年人，女性多于男性。多数患者有疼痛、粗糙等不适感觉。如长期糜烂则可能易恶变，WHO（世界卫生组织）将其列入潜在恶性疾病的范畴。\n\n## 口腔扁平苔藓会传染吗?\n\n口腔扁平苔藓是一种发生于口腔的慢性炎性疾病，**不会传染**，因此患者的食物和餐具也无须和家人分开。\n\n## 口腔扁平苔藓会遗传吗?\n\n目前尚无确切证据证实该疾病会遗传，学术界存在不同意见。但曾有研究发现在一个家庭中发现有数人发病；有些患者有家族史。\n\n## 口腔扁平苔藓患者要戒烟戒酒吗?\n\n口腔扁平苔藓患者应**戒烟、戒酒**。有研究表明，烟、酒刺激易致口腔黏膜病损癌变。\n\n## 口腔扁平苔藓能治愈吗?如果能治愈，还会复发吗?\n\n该病的病因尚未完全明确。因为口腔扁平苔藓是口腔黏膜慢性炎性疾病，所以**易复发**。积极预防和治疗系统性疾病可以减少口腔扁平苔藓复发，有利于病损的愈合。有的患者以控制糜烂为主。患者应遵照医嘱**定期复查**，复查周期建议不要超过半年。**忌口**对于防止口腔扁平苔藓复发非常关键，过度的疲劳或一顿放纵的饮食，都可能造成该疾病的复发。\n\n## 口腔扁平苔藓患者的日常护理\n\n(1) 没有自觉症状的患者，让自己身心放松，生活要乐观向上，劳逸结合，加强体育锻炼，并定期随访。\n\n(2) 对糜烂经久不愈者，要及时就医，追踪观察，必要时取病理。给予个体化软食，注意补充优质蛋白和各类维生素，保证自身营养均衡。\n\n(3) 平日生活中应尽量避免进食烫、辣（生葱、生蒜、辣椒）、麻（花椒）、涩（猕猴桃、菠萝、柿子、蚕豆、笋)、冰等食物；同时，过硬（炒瓜子、油炸）、过大的食物也会增加黏膜的摩擦，导致疾病发生发展。\n\n(4) 羊肉、狗肉、马肉、鹿肉、驴肉等肉食属温热食，**尽可能少食**。鱼虾、海鲜在去壳、去刺的情况下，一般还是可以食用的。\n\n(5) 日常生活中，一些不健康动作如：咬舌、咬唇、咬颊等，时间长会损害黏膜上皮。老年人尤其要提防自己的假牙，检查假牙是否合适。选用柔软毛刷牙。\n\n(6) 加强口腔卫生，食用牛奶或含糖高的饮料后清水漱口。龋齿、牙齿不良修复体要积极治疗。\n\n## 心理因素会导致口腔扁平苔藓的发生吗?\n\n研究表明，口腔扁平苔藓的发生、发展与身心因素有密切关系。50%的该疾病患者有精神创伤史，或生活压力过大，或精神生活空虚等。临床中常见到因这种心理异常导致机体功能紊乱，促使口腔扁平苔藓发病、病情加重或反复发作、迁延不愈。',
            recommendation: 'AI系统检测出口腔扁平苔藓。口腔扁平苔藓常见白色网状/蕾丝样细纹，可能伴有红斑或糜烂，部分患者有灼痛、粗糙或刺激痛。长期或反复糜烂者需密切随访。建议尽快就诊口腔黏膜专科/口腔内科，医生可能建议进行真菌学评估、去除刺激因素，并在评估后进行组织病理学活检以明确分型与风险。',
            reportRecommendation: '尽快预约专科门诊：请您尽快预约三甲医院或口腔专科医院的“口腔黏膜科”或“口腔内科”。\n\n 保持积极心态：请不要过分紧张或焦虑。早期发现并寻求专业帮助，是保障口腔健康最好的方式。在专科医生给出明确诊断前，请保持正常生活，但建议暂停吸烟、饮酒等不良习惯。\n\n请注意：本筛查旨在提高潜在风险病变的检出率，需与临床诊断结合进行综合评估。'
        };
      // 6. OSF 阳性待排
      case 'OSF_POSITIVE':
        return {
          finding: `口腔黏膜下纤维性变（OSF） 阳性待排${cText}`,
            knowledge: '# 口腔黏膜下纤维性变（OSF）\n\n口腔黏膜下纤维性变（OSF）是一种可累及全部口腔黏膜的慢性口腔黏膜疾病。该病具有一定的**恶性潜能**，属于**口腔潜在恶性疾患**的一种，可能发展成为口腔癌。研究表明，在咀嚼槟榔人群中，OSF**癌变率约7%-30%**。OSF的发病和咀嚼槟榔**密切相关**。此外，进食辣椒、吸烟、饮酒等刺激因素，营养元素缺乏，免疫因素、遗传因素、微循环障碍、血液流变学异常等其他因素亦参与OSF的疾病发生发展。\n\n## 临床表现\n\nOSF的临床表现主要为口腔黏膜灼痛、进食刺激性食物烧灼痛、黏膜发紧导致不能鼓颊或吹口哨等张口受限症状。临床检查可发现口腔黏膜色苍白、黏膜弹性下降变硬、纤维条索形成、张口度减小、黏膜水疱或溃疡形成、小唾液腺分泌障碍等。\n\n## 诊断\n\n临床上，一般根据咀嚼槟榔病史和临床表现进行疾病的初步诊断，**组织病理学**是判断OSF严重程度及是否癌变的**金标准**，此外，对于初诊OSF进行活检还能为疾病提供基线资料，因此**推荐OSF初诊患者进行组织病理学检查**。为满足广大口腔黏膜病患者的需求，浙大口腔黏膜病科室现开展自体荧光检查及甲苯胺蓝检查等无创检查可进行早癌辅助筛查。\n\n## 治疗\n\n（1）改善不良生活习惯：戒除咀嚼槟榔习惯，戒烟，戒酒，减少辛辣、刺激、粗糙食物，补充维生素和微量元素，防治营养不良。这也是**最重要的治疗方式之一**。\n\n（2）药物治疗：原则为抗炎、抗纤维化、改善缺血以及抗氧化，包括局部药物治疗与口服药物治疗。局部药物治疗主要指在病损区行局部封闭治疗，一般1周一次，4-10周为一个疗程，每个疗程间隔1-2个月。口服治疗主要包括丹参滴丸、番茄红素、维生素、微量元素、中药等。\n\n（3）非药物治疗：包含张口训练，光动力治疗，激光治疗，高压氧治疗等。\n\n（4）手术治疗：主要应用于张口受限严重，伴发白斑或口腔鳞状细胞癌等人群。\n\n## 重要提示\n\n需要注意的是，无论采取何种治疗手段，均无法彻底阻断OSF的癌变，所以**定期复诊十分重要**，定期复诊可以使医生发现早期癌变，及时干预。',
            recommendation: 'AI系统检测出口腔黏膜下纤维性变。口腔黏膜下纤维性变与咀嚼槟榔高度相关。特征为黏膜苍白、弹性丧失，导致张口困难、烧灼感，癌变风险很高。典型症状为进行性张口受限。建议尽快就诊口腔黏膜专科/口腔内科，医生可能建议进行真菌学评估、去除刺激因素，并在评估后进行组织病理学活检以明确分型与风险。',
            reportRecommendation: '尽快预约专科门诊：请您尽快预约三甲医院或口腔专科医院的“口腔黏膜科”或“口腔内科”。\n\n 保持积极心态：请不要过分紧张或焦虑。早期发现并寻求专业帮助，是保障口腔健康最好的方式。在专科医生给出明确诊断前，请保持正常生活，但建议暂停吸烟、饮酒等不良习惯。\n\n请注意：本筛查旨在提高潜在风险病变的检出率，需与临床诊断结合进行综合评估。'
        };
      default:
        return {
          finding: `其他可能情况待排${cText}`,
          knowledge: '（占位）默认 - 医学知识宣讲',
          recommendation: '（占位）默认 - 诊断结果/建议',
          reportRecommendation: '（占位）默认 - 详细诊断建议'
        };
    }
  }

//BACKUP
  // private generateTextsByStatus(statusCode: string, confidence?: number): { finding: string; knowledge: string; recommendation: string; reportRecommendation: string } {
  //   const cText = confidence !== undefined ? `（置信度 ${(confidence * 100).toFixed(1)}%）` : '';
  //   switch (statusCode) {
  //     // 1. OPMD 阳性待排
  //     case 'OPMD_POSITIVE':
  //       return {
  //         finding: `潜在恶性疾病阳性待排${cText}`,
  //         knowledge: '# 口腔黏膜潜在恶性疾病阳性？科学认知与管理指南\n\n## 一、正确理解“口腔黏膜潜在恶性疾病”\n\n“潜在恶性疾病”听起来可能有些令人紧张，但请正确理解：它**不是癌症**，而是指一类发生于口腔黏膜的、有更高癌变风险的病变。它们是身体发出的“警示信号”，提醒我们需要比以往更加关注口腔健康。只要我们给予足够的重视，通过科学的监测和及时的干预，绝大多数病变都可以得到有效控制，癌变的风险也能被降到最低。\n\n口腔黏膜潜在恶性疾病包括：口腔白斑，增殖性疣状白斑，口腔红斑，口腔黏膜下纤维性变，口腔扁平苔藓，光化性唇炎，倒吸烟相关腭部病损，口腔红斑狼疮，先天性角化异常，口腔苔藓样病变，口腔移植物抗宿主病。\n\n## 二、需要警惕的“警示信号”：哪些迹象需及时就医？\n\n当您的口腔内出现以下任何一种情况，且持续存在超过2-4周未能自行愈合时，都应及时就医检查：\n\n（1）颜色异常：出现无法擦掉的白色斑块（白斑）、鲜红色斑块（红斑）或红白相间的斑块。\n\n（2）质地改变：黏膜表面变得粗糙、增厚、变硬，或出现像菜花、桑葚一样的疣状增生。\n\n（3）长期不愈的溃疡：任何部位出现的固定、边缘不清晰、基底发硬的溃疡或糜烂。\n\n（4）功能障碍：无明显原因地出现进行性的张口困难、舌头活动不灵、吞咽或说话困难。\n\n（5）异常感觉：口腔内出现反复的烧灼感、麻木感、干燥感或不明原因的疼痛。\n\n## 三、致病原因与高危因素\n\n（1）烟草与酒精：长期、大量的吸烟和饮酒是诱发多种口腔黏膜病变及口腔癌的**头号元凶**。\n\n（2）咀嚼槟榔：这是导致“口腔黏膜下纤维化”的**最主要原因**，具有极强的致病性和致癌性。\n\n（3）局部慢性刺激：尖锐的牙尖、牙齿残根、不合适的假牙或修复体长期摩擦口腔黏膜。\n\n（4）不良饮食习惯：长期偏爱过烫、辛辣刺激的食物。\n\n（5）病毒感染：特定亚型的人乳头瘤病毒（HPV）感染与某些病变的发生有关。\n\n（6）其他因素：包括营养不良（如缺乏维生素A、B族）、免疫功能紊乱、遗传易感性、过度日光照射（与唇部病变相关）等。\n\n## 四、诊断与治疗方式\n\n## 诊断金标准——病理活检\n\n对于可疑的病变，医生通常会取一小块组织（约绿豆大小）进行病理学检查。这是判断病变良恶性、有无癌变倾向的**唯一可靠方法**。请不要惧怕活检，它是一个简单、安全且至关重要的步骤。\n\n## 治疗核心原则——个体化与系统化\n\n（1）去除病因是第一步：立即戒烟、戒酒、戒槟榔，调整或去除口腔内一切不良刺激物。这是所有治疗的基础。\n\n（2）定期随访是基石：对于低风险的病变，最重要的“治疗”就是遵医嘱定期复查（通常为3-6个月或1年）。医生会严密监测病变的变化。\n\n（3）积极干预是手段：对于经活检证实有中、重度不典型增生（即癌变风险较高）的病变，医生会根据具体情况，采取药物、激光、冷冻或手术切除等方式进行干预。\n\n## 五、患者的自我管理与配合\n\n管理口腔黏膜潜在恶性疾病，是一场需要您深度参与的“持久战”。您的积极配合至关重要：\n\n（1）坚决戒除不良习惯：这是您可以为自己做的**最重要的一件事**。\n\n（2）养成自我检查习惯：每月一次，在光线充足的地方，用镜子仔细检查自己的口腔（包括唇、颊、舌、上颚、口底等所有角落），留意任何新出现的变化。\n\n（3）保持良好口腔卫生：使用软毛牙刷，温和刷牙，餐后漱口。\n\n（4）调整生活方式：均衡饮食，多吃新鲜蔬果，保证充足睡眠，适度锻炼，保持乐观心态，减轻精神压力。\n\n（5）绝对不要错过任何一次复查：请将复查日期标记在日历上。您的坚持，是对自己健康的最大负责。\n\n请记住，发现潜在恶性疾病并不可怕，可怕的是忽视与拖延。让我们医患携手，科学管理，防患于未然，共同守护您的口腔与全身健康！',
  //         recommendation: '系统在您提交的照片中发现了一些与潜在健康风险有关的特征，需要由经验更丰富的口腔黏膜专科医生为您做一次更深入、更全面的检查来确认。建议您尽快预约三甲医院或口腔专科医院的“口腔黏膜科”或“口腔内科”，寻求专业帮助，保障口腔健康。\n\n本AI筛查结果仅为辅助诊断参考，不能取代执业医师的专业诊断。',
  //         reportRecommendation: 'AI系统检测出口腔黏膜潜在恶性疾病。口腔黏膜潜在恶性疾病指的是一类在形态或组织学上发生改变的口腔黏膜疾病，其发生口腔癌的风险显著高于正常黏膜。口腔黏膜潜在恶性疾病包括口腔白斑、口腔扁平苔藓、口腔黏膜下纤维性变等。建议尽快就诊口腔黏膜专科/口腔内科。'
  //       };

  //     // 2. OPMD 疑似阳性待排
  //     case 'OPMD_SUSPECTED':
  //       return {
  //         finding: `潜在恶性疾病疑似阳性待排${cText}`,
  //         knowledge: '# 口腔黏膜潜在恶性疾病疑似阳性？科学认知与管理指南\n\n## 一、正确理解“口腔黏膜潜在恶性疾病”\n\n“潜在恶性疾病”听起来可能有些令人紧张，但请正确理解：它**不是癌症**，而是指一类发生于口腔黏膜的、有更高癌变风险的病变。它们是身体发出的“警示信号”，提醒我们需要比以往更加关注口腔健康。只要我们给予足够的重视，通过科学的监测和及时的干预，绝大多数病变都可以得到有效控制，癌变的风险也能被降到最低。\n\n口腔黏膜潜在恶性疾病包括：口腔白斑，增殖性疣状白斑，口腔红斑，口腔黏膜下纤维性变，口腔扁平苔藓，光化性唇炎，倒吸烟相关腭部病损，口腔红斑狼疮，先天性角化异常，口腔苔藓样病变，口腔移植物抗宿主病。\n\n## 二、需要警惕的“警示信号”：哪些迹象需及时就医？\n\n当您的口腔内出现以下任何一种情况，且持续存在超过2-4周未能自行愈合时，都应及时就医检查：\n\n（1）颜色异常：出现无法擦掉的白色斑块（白斑）、鲜红色斑块（红斑）或红白相间的斑块。\n\n（2）质地改变：黏膜表面变得粗糙、增厚、变硬，或出现像菜花、桑葚一样的疣状增生。\n\n（3）长期不愈的溃疡：任何部位出现的固定、边缘不清晰、基底发硬的溃疡或糜烂。\n\n（4）功能障碍：无明显原因地出现进行性的张口困难、舌头活动不灵、吞咽或说话困难。\n\n（5）异常感觉：口腔内出现反复的烧灼感、麻木感、干燥感或不明原因的疼痛。\n\n## 三、致病原因与高危因素\n\n（1）烟草与酒精：长期、大量的吸烟和饮酒是诱发多种口腔黏膜病变及口腔癌的**头号元凶**。\n\n（2）咀嚼槟榔：这是导致“口腔黏膜下纤维化”的**最主要原因**，具有极强的致病性和致癌性。\n\n（3）局部慢性刺激：尖锐的牙尖、牙齿残根、不合适的假牙或修复体长期摩擦口腔黏膜。\n\n（4）不良饮食习惯：长期偏爱过烫、辛辣刺激的食物。\n\n（5）病毒感染：特定亚型的人乳头瘤病毒（HPV）感染与某些病变的发生有关。\n\n（6）其他因素：包括营养不良（如缺乏维生素A、B族）、免疫功能紊乱、遗传易感性、过度日光照射（与唇部病变相关）等。\n\n## 四、诊断与治疗方式\n\n## 诊断金标准——病理活检\n\n对于可疑的病变，医生通常会取一小块组织（约绿豆大小）进行病理学检查。这是判断病变良恶性、有无癌变倾向的**唯一可靠方法**。请不要惧怕活检，它是一个简单、安全且至关重要的步骤。\n\n## 治疗核心原则——个体化与系统化\n\n（1）去除病因是第一步：立即戒烟、戒酒、戒槟榔，调整或去除口腔内一切不良刺激物。这是所有治疗的基础。\n\n（2）定期随访是基石：对于低风险的病变，最重要的“治疗”就是遵医嘱定期复查（通常为3-6个月或1年）。医生会严密监测病变的变化。\n\n（3）积极干预是手段：对于经活检证实有中、重度不典型增生（即癌变风险较高）的病变，医生会根据具体情况，采取药物、激光、冷冻或手术切除等方式进行干预。\n\n## 五、患者的自我管理与配合\n\n管理口腔黏膜潜在恶性疾病，是一场需要您深度参与的“持久战”。您的积极配合至关重要：\n\n（1）坚决戒除不良习惯：这是您可以为自己做的**最重要的一件事**。\n\n（2）养成自我检查习惯：每月一次，在光线充足的地方，用镜子仔细检查自己的口腔（包括唇、颊、舌、上颚、口底等所有角落），留意任何新出现的变化。\n\n（3）保持良好口腔卫生：使用软毛牙刷，温和刷牙，餐后漱口。\n\n（4）调整生活方式：均衡饮食，多吃新鲜蔬果，保证充足睡眠，适度锻炼，保持乐观心态，减轻精神压力。\n\n（5）绝对不要错过任何一次复查：请将复查日期标记在日历上。您的坚持，是对自己健康的最大负责。\n\n请记住，发现潜在恶性疾病并不可怕，可怕的是忽视与拖延。让我们医患携手，科学管理，防患于未然，共同守护您的口腔与全身健康！',
  //         recommendation: '系统在您提交的照片中发现了可能与潜在健康风险有关的特征，需要由经验更丰富的口腔黏膜专科医生进一步确认。建议您尽快预约三甲医院或口腔专科医院的“口腔黏膜科”或“口腔内科”，寻求专业帮助，保障口腔健康。\n\n本AI筛查结果仅为辅助诊断参考，不能取代执业医师的专业诊断。',
  //         reportRecommendation: 'AI系统怀疑可能患有口腔黏膜潜在恶性疾病。口腔黏膜潜在恶性疾病指的是一类在形态或组织学上发生改变的口腔黏膜疾病，其发生口腔癌的风险显著高于正常黏膜。口腔黏膜潜在恶性疾病包括口腔白斑、口腔扁平苔藓、口腔黏膜下纤维性变等。建议尽快就诊口腔黏膜专科/口腔内科。'
  //       };
  //     // 3. OPMD 阴性待排
  //     case 'OPMD_NEGATIVE':
  //       return {
  //         finding: `潜在恶性疾病阴性待排${cText}`,
  //         knowledge: '# 口腔黏膜潜在恶性疾病阴性？科学认知与管理指南\n\n## 一、正确理解“口腔黏膜潜在恶性疾病”\n\n“潜在恶性疾病”听起来可能有些令人紧张，但请正确理解：它**不是癌症**，而是指一类发生于口腔黏膜的、有更高癌变风险的病变。它们是身体发出的“警示信号”，提醒我们需要比以往更加关注口腔健康。只要我们给予足够的重视，通过科学的监测和及时的干预，绝大多数病变都可以得到有效控制，癌变的风险也能被降到最低。\n\n口腔黏膜潜在恶性疾病包括：口腔白斑，增殖性疣状白斑，口腔红斑，口腔黏膜下纤维性变，口腔扁平苔藓，光化性唇炎，倒吸烟相关腭部病损，口腔红斑狼疮，先天性角化异常，口腔苔藓样病变，口腔移植物抗宿主病。\n\n## 二、需要警惕的“警示信号”：哪些迹象需及时就医？\n\n当您的口腔内出现以下任何一种情况，且持续存在超过2-4周未能自行愈合时，都应及时就医检查：\n\n（1）颜色异常：出现无法擦掉的白色斑块（白斑）、鲜红色斑块（红斑）或红白相间的斑块。\n\n（2）质地改变：黏膜表面变得粗糙、增厚、变硬，或出现像菜花、桑葚一样的疣状增生。\n\n（3）长期不愈的溃疡：任何部位出现的固定、边缘不清晰、基底发硬的溃疡或糜烂。\n\n（4）功能障碍：无明显原因地出现进行性的张口困难、舌头活动不灵、吞咽或说话困难。\n\n（5）异常感觉：口腔内出现反复的烧灼感、麻木感、干燥感或不明原因的疼痛。\n\n## 三、致病原因与高危因素\n\n（1）烟草与酒精：长期、大量的吸烟和饮酒是诱发多种口腔黏膜病变及口腔癌的**头号元凶**。\n\n（2）咀嚼槟榔：这是导致“口腔黏膜下纤维化”的**最主要原因**，具有极强的致病性和致癌性。\n\n（3）局部慢性刺激：尖锐的牙尖、牙齿残根、不合适的假牙或修复体长期摩擦口腔黏膜。\n\n（4）不良饮食习惯：长期偏爱过烫、辛辣刺激的食物。\n\n（5）病毒感染：特定亚型的人乳头瘤病毒（HPV）感染与某些病变的发生有关。\n\n（6）其他因素：包括营养不良（如缺乏维生素A、B族）、免疫功能紊乱、遗传易感性、过度日光照射（与唇部病变相关）等。\n\n## 四、诊断与治疗方式\n\n## 诊断金标准——病理活检\n\n对于可疑的病变，医生通常会取一小块组织（约绿豆大小）进行病理学检查。这是判断病变良恶性、有无癌变倾向的**唯一可靠方法**。请不要惧怕活检，它是一个简单、安全且至关重要的步骤。\n\n## 治疗核心原则——个体化与系统化\n\n（1）去除病因是第一步：立即戒烟、戒酒、戒槟榔，调整或去除口腔内一切不良刺激物。这是所有治疗的基础。\n\n（2）定期随访是基石：对于低风险的病变，最重要的“治疗”就是遵医嘱定期复查（通常为3-6个月或1年）。医生会严密监测病变的变化。\n\n（3）积极干预是手段：对于经活检证实有中、重度不典型增生（即癌变风险较高）的病变，医生会根据具体情况，采取药物、激光、冷冻或手术切除等方式进行干预。\n\n## 五、患者的自我管理与配合\n\n管理口腔黏膜潜在恶性疾病，是一场需要您深度参与的“持久战”。您的积极配合至关重要：\n\n（1）坚决戒除不良习惯：这是您可以为自己做的**最重要的一件事**。\n\n（2）养成自我检查习惯：每月一次，在光线充足的地方，用镜子仔细检查自己的口腔（包括唇、颊、舌、上颚、口底等所有角落），留意任何新出现的变化。\n\n（3）保持良好口腔卫生：使用软毛牙刷，温和刷牙，餐后漱口。\n\n（4）调整生活方式：均衡饮食，多吃新鲜蔬果，保证充足睡眠，适度锻炼，保持乐观心态，减轻精神压力。\n\n（5）绝对不要错过任何一次复查：请将复查日期标记在日历上。您的坚持，是对自己健康的最大负责。\n\n请记住，发现潜在恶性疾病并不可怕，可怕的是忽视与拖延。让我们医患携手，科学管理，防患于未然，共同守护您的口腔与全身健康！',
  //         recommendation: '系统未在您提交的口腔图片中发现与口腔黏膜潜在恶性疾病相关的明显迹象。希望您保持健康生活习惯，定期进行专业检查。\n\n本AI筛查结果仅为辅助诊断参考，不能取代执业医师的专业诊断。',
  //         reportRecommendation: 'AI系统未检测出口腔黏膜潜在恶性疾病。建议保持健康生活方式，如避免过烫过辣的饮食；观察口腔环境，注意有无出现白斑、红斑、不明原因的破溃等情况；定期进行口腔检查。'
  //       };
  //     // 4. OLK 阳性待排
  //     case 'OLK_POSITIVE':
  //       return {
  //         finding: `口腔白斑病（OLK） 阳性待排${cText}`,
  //           knowledge: '# 口腔白斑健康教育\n\n说起“口腔白斑”，很多患者朋友们往往会顾名思义，认为凡是发生在口腔粘膜上的白色斑块都是白斑，一旦发生白斑就会有恶变的可能，其实这种理解是不对的，**口腔白斑病人约3%---5%会发生癌变**。2005年WHO将口腔白斑归为癌前病变，“癌前病变”不是“癌”，只因为口腔白斑病理表现为上皮异常增生，所以癌变机率高于正常上皮组织。口腔粘膜白斑可表现为五种形态特征：斑块状、皱纹纸状、颗粒状、疣状、溃疡状，前两类为均质型，后三类为非均质型，**非均质型癌变几率大于均质型**。国内研究显示，**女性患者白斑的危险性是男性的2.49倍**，**舌部及口底白斑危险性高于其他部位**，**疣状白斑的危险性是均质型白斑的10倍**。根据口腔病理改变，口腔粘膜白斑分为轻、中、重度异常增生，**中度异常增生白斑的危险性是单纯增生或轻度异常增生性白斑的276.48倍**，**重度异常增生白斑癌变风险是单纯增生或轻度异常增生性白斑的499.55倍**。\n\n# 口腔白斑癌变倾向较高的情况\n有以下情况的口腔白斑患者癌变倾向较大，应该提高警惕，严密观察，必要时可进行多次组织活检：\n（1）年龄：年龄较大，如60岁以上者；\n（2）性别：不吸烟的女性，特别是年轻女性患者，这种特发性白斑恶变可能性大；\n（3）吸烟：吸烟时间长，烟量大（如吸烟年数×每天支数>400)者；\n（4）部位：舌缘、舌腹、口底及口角部位；\n（5）类型：疣状，颗粒型，溃疡或糜烂型及伴有念珠菌感染者；\n（6）病理：伴有上皮异常增生者，程度越重越易恶变；\n（7）时间：病变时间较长者；\n（8）症状：有刺激性痛或自发痛者。\n\n# 口腔白斑的发病原因\n为什么会生口腔白斑？具体原因如下：\n（1）吸烟等理化刺激：与白斑的发生密切相关，白斑的发生率与吸烟时间的长短及吸烟量呈正比关系。发病部位与烟接触口腔的方式、烟雾刺激的部位有关。吸烟对口腔黏膜可以产生物理、化学刺激引起口腔黏膜的病理性变化。吸烟时产生的高温对口腔有灼伤作用，引起局部黏膜充血、水肿，同时烟和烟燃烧时产生的烟雾中含有尼古丁、焦油、二苯蒽等致癌物质。这些有害的物质可直接进入口腔黏膜上皮，破坏黏膜上皮，通过长期慢性刺激，使局部形成一种慢性炎症过程，机体产生一种防御性的增生反应；\n（2）局部刺激：饮酒、进食过烫或酸辣食物、嚼槟榔等均与白斑形成相关。食用刺激性食物如烫、辣、硬食会使上消化道黏膜组织发生不同程度的损伤，轻者导致黏膜充血、水肿、变性、渗出，形成炎症，重者组织细胞坏死、脱落形成糜烂和浅表溃疡，继而上皮修复增生、过度增生而发生黏膜白斑；\n（3）白色念珠菌感染：与白斑有密切关系，据国内学者调查，我国口腔白斑患者中，白色念珠菌阳性率为34%左右。用白色念珠菌感染动物可制备白斑动物模型，显示白色念珠菌可能是白斑发生的一个重要致病因素或是其中的一种合并因素。临床表明，伴有白色念珠菌感染的白斑——“白念白斑”容易发生恶性病变；\n（4）全身因素：包括微量元素、微循环改变、易感的遗传素质、脂溶性维生素缺乏等；\n（5）中医观点：中医认为口腔黏膜与病人全身因素，特别是气血循环障碍有很大关系。一些患者用中药活血化瘀治疗取得较好的效果就是一个例证；\n（6）其他相关因素：迄今为止，对口腔白斑癌变的发病原因尚不明确，但普遍认为白斑癌变与理化因素长期作用、致癌剂损伤、遗传物质以及免疫功能不全有关。近来研究表明，白斑的发生与人类乳头状瘤病毒(HPV)的感染有密切关系。在口腔黏膜白斑中发现有可诱发癌变的HPV16感染；同时，中医还认为，肺胃积热、外感毒邪，内外合邪，熏蒸于上或下流注而发本病。\n\n# 口腔白斑的治疗方法\n\n ## 常规治疗 \n\n治疗第一步是去除任何可能的刺激因素，去除残根、残冠及不良修复体，纠正不良生活习惯。例如戒烟戒酒，不吃刺激食品和过烫、粗糙食物等。然后根据不同的病情决定用药还是采用激光、冷冻、微波等其他治疗方案。**定期随访是非常重要的**，如果观察到白斑增厚、变硬、出现溃疡等的时候，应及时手术切除。对于癌变危险性高的，我们也要及时切除活检。\n\n ## 中医治疗 \n\n对白斑进行中医分型辩证施治也是一种治疗方法，但是同样做不到根治。比如痰湿凝聚型的白斑给予健脾化湿消斑；气血亏虚型的给予补气益血祛斑；瘀血内阻型的给予活血化瘀化斑。祖国的医学文献中有不少可以用于治疗口腔黏膜病的“经方”，但是没有“一方特治一病”的记载。目前我们通过发掘中医药古方和总结临床经验相结合，形成了一些相对固定的方剂和制剂，例如复方绞股蓝胶囊、五白方、双花方等，经过辩证用于某些口腔黏膜病，有一定的疗效，但是不能称之为特效药。',
  //           recommendation: 'AI系统检测出口腔白斑病。口腔白斑病是一种发生在口腔黏膜上的、不能被擦去的、白色斑块或斑片。口腔白斑病的癌变风险与其临床类型及病理分级密切相关。非均质型（如颗粒状、疣状、溃疡状）的风险通常高于均质型。建议尽快就诊口腔黏膜专科/口腔内科，医生可能建议进行真菌学评估、去除刺激因素，并在评估后进行组织病理学活检以明确分型与风险。',
  //           reportRecommendation: 'AI系统检测出口腔白斑病。口腔白斑病是一种发生在口腔黏膜上的、不能被擦去的、白色斑块或斑片。口腔白斑病的癌变风险与其临床类型及病理分级密切相关。非均质型（如颗粒状、疣状、溃疡状）的风险通常高于均质型。建议尽快就诊口腔黏膜专科/口腔内科，医生可能建议进行真菌学评估、去除刺激因素，并在评估后进行组织病理学活检以明确分型与风险。'
  //       };
  //     // 5. OLP 阳性待排
  //     case 'OLP_POSITIVE':
  //       return {
  //         finding: `口腔扁平苔藓（OLP） 阳性待排${cText}`,
  //           knowledge: '# 口腔扁平苔藓健康教育\n\n口腔扁平苔藓是口腔黏膜病种仅次于复发性阿弗他溃疡的常见良性疾病，其患病率约0.1%—4%。该病好发于中年人，女性多于男性。多数患者有疼痛、粗糙等不适感觉。如长期糜烂则可能易恶变，WHO（世界卫生组织）将其列入潜在恶性疾病的范畴。\n\n## 口腔扁平苔藓会传染吗?\n\n口腔扁平苔藓是一种发生于口腔的慢性炎性疾病，**不会传染**，因此患者的食物和餐具也无须和家人分开。\n\n## 口腔扁平苔藓会遗传吗?\n\n目前尚无确切证据证实该疾病会遗传，学术界存在不同意见。但曾有研究发现在一个家庭中发现有数人发病；有些患者有家族史。\n\n## 口腔扁平苔藓患者要戒烟戒酒吗?\n\n口腔扁平苔藓患者应**戒烟、戒酒**。有研究表明，烟、酒刺激易致口腔黏膜病损癌变。\n\n## 口腔扁平苔藓能治愈吗?如果能治愈，还会复发吗?\n\n该病的病因尚未完全明确。因为口腔扁平苔藓是口腔黏膜慢性炎性疾病，所以**易复发**。积极预防和治疗系统性疾病可以减少口腔扁平苔藓复发，有利于病损的愈合。有的患者以控制糜烂为主。患者应遵照医嘱**定期复查**，复查周期建议不要超过半年。**忌口**对于防止口腔扁平苔藓复发非常关键，过度的疲劳或一顿放纵的饮食，都可能造成该疾病的复发。\n\n## 口腔扁平苔藓患者的日常护理\n\n(1) 没有自觉症状的患者，让自己身心放松，生活要乐观向上，劳逸结合，加强体育锻炼，并定期随访。\n\n(2) 对糜烂经久不愈者，要及时就医，追踪观察，必要时取病理。给予个体化软食，注意补充优质蛋白和各类维生素，保证自身营养均衡。\n\n(3) 平日生活中应尽量避免进食烫、辣（生葱、生蒜、辣椒）、麻（花椒）、涩（猕猴桃、菠萝、柿子、蚕豆、笋)、冰等食物；同时，过硬（炒瓜子、油炸）、过大的食物也会增加黏膜的摩擦，导致疾病发生发展。\n\n(4) 羊肉、狗肉、马肉、鹿肉、驴肉等肉食属温热食，**尽可能少食**。鱼虾、海鲜在去壳、去刺的情况下，一般还是可以食用的。\n\n(5) 日常生活中，一些不健康动作如：咬舌、咬唇、咬颊等，时间长会损害黏膜上皮。老年人尤其要提防自己的假牙，检查假牙是否合适。选用柔软毛刷牙。\n\n(6) 加强口腔卫生，食用牛奶或含糖高的饮料后清水漱口。龋齿、牙齿不良修复体要积极治疗。\n\n## 心理因素会导致口腔扁平苔藓的发生吗?\n\n研究表明，口腔扁平苔藓的发生、发展与身心因素有密切关系。50%的该疾病患者有精神创伤史，或生活压力过大，或精神生活空虚等。临床中常见到因这种心理异常导致机体功能紊乱，促使口腔扁平苔藓发病、病情加重或反复发作、迁延不愈。',
  //           recommendation: 'AI系统检测出口腔扁平苔藓。口腔扁平苔藓常见白色网状/蕾丝样细纹，可能伴有红斑或糜烂，部分患者有灼痛、粗糙或刺激痛。长期或反复糜烂者需密切随访。建议尽快就诊口腔黏膜专科/口腔内科，医生可能建议进行真菌学评估、去除刺激因素，并在评估后进行组织病理学活检以明确分型与风险。',
  //           reportRecommendation: 'AI系统检测出口腔扁平苔藓。口腔扁平苔藓常见白色网状/蕾丝样细纹，可能伴有红斑或糜烂，部分患者有灼痛、粗糙或刺激痛。长期或反复糜烂者需密切随访。建议尽快就诊口腔黏膜专科/口腔内科，医生可能建议进行真菌学评估、去除刺激因素，并在评估后进行组织病理学活检以明确分型与风险。'
  //       };
  //     // 6. OSF 阳性待排
  //     case 'OSF_POSITIVE':
  //       return {
  //         finding: `口腔黏膜下纤维性变（OSF） 阳性待排${cText}`,
  //           knowledge: '# 口腔黏膜下纤维性变（OSF）\n\n口腔黏膜下纤维性变（OSF）是一种可累及全部口腔黏膜的慢性口腔黏膜疾病。该病具有一定的**恶性潜能**，属于**口腔潜在恶性疾患**的一种，可能发展成为口腔癌。研究表明，在咀嚼槟榔人群中，OSF**癌变率约7%-30%**。OSF的发病和咀嚼槟榔**密切相关**。此外，进食辣椒、吸烟、饮酒等刺激因素，营养元素缺乏，免疫因素、遗传因素、微循环障碍、血液流变学异常等其他因素亦参与OSF的疾病发生发展。\n\n## 临床表现\n\nOSF的临床表现主要为口腔黏膜灼痛、进食刺激性食物烧灼痛、黏膜发紧导致不能鼓颊或吹口哨等张口受限症状。临床检查可发现口腔黏膜色苍白、黏膜弹性下降变硬、纤维条索形成、张口度减小、黏膜水疱或溃疡形成、小唾液腺分泌障碍等。\n\n## 诊断\n\n临床上，一般根据咀嚼槟榔病史和临床表现进行疾病的初步诊断，**组织病理学**是判断OSF严重程度及是否癌变的**金标准**，此外，对于初诊OSF进行活检还能为疾病提供基线资料，因此**推荐OSF初诊患者进行组织病理学检查**。为满足广大口腔黏膜病患者的需求，浙大口腔黏膜病科室现开展自体荧光检查及甲苯胺蓝检查等无创检查可进行早癌辅助筛查。\n\n## 治疗\n\n（1）改善不良生活习惯：戒除咀嚼槟榔习惯，戒烟，戒酒，减少辛辣、刺激、粗糙食物，补充维生素和微量元素，防治营养不良。这也是**最重要的治疗方式之一**。\n\n（2）药物治疗：原则为抗炎、抗纤维化、改善缺血以及抗氧化，包括局部药物治疗与口服药物治疗。局部药物治疗主要指在病损区行局部封闭治疗，一般1周一次，4-10周为一个疗程，每个疗程间隔1-2个月。口服治疗主要包括丹参滴丸、番茄红素、维生素、微量元素、中药等。\n\n（3）非药物治疗：包含张口训练，光动力治疗，激光治疗，高压氧治疗等。\n\n（4）手术治疗：主要应用于张口受限严重，伴发白斑或口腔鳞状细胞癌等人群。\n\n## 重要提示\n\n需要注意的是，无论采取何种治疗手段，均无法彻底阻断OSF的癌变，所以**定期复诊十分重要**，定期复诊可以使医生发现早期癌变，及时干预。',
  //           recommendation: 'AI系统检测出口腔黏膜下纤维性变。口腔黏膜下纤维性变与咀嚼槟榔高度相关。特征为黏膜苍白、弹性丧失，导致张口困难、烧灼感，癌变风险很高。典型症状为进行性张口受限。建议尽快就诊口腔黏膜专科/口腔内科，医生可能建议进行真菌学评估、去除刺激因素，并在评估后进行组织病理学活检以明确分型与风险。',
  //           reportRecommendation: 'AI系统检测出口腔黏膜下纤维性变。口腔黏膜下纤维性变与咀嚼槟榔高度相关。特征为黏膜苍白、弹性丧失，导致张口困难、烧灼感，癌变风险很高。典型症状为进行性张口受限。建议尽快就诊口腔黏膜专科/口腔内科，医生可能建议进行真菌学评估、去除刺激因素，并在评估后进行组织病理学活检以明确分型与风险。'
  //       };
  //     default:
  //       return {
  //         finding: `其他可能情况待排${cText}`,
  //         knowledge: '（占位）默认 - 医学知识宣讲',
  //         recommendation: '（占位）默认 - 诊断结果/建议',
  //         reportRecommendation: '（占位）默认 - 详细诊断建议'
  //       };
  //   }
  // }

  // 用于深度多分类结果（第三层）映射六态之一
  private judgeStatusFromDeep(deep: { OLP: number; OLK: number; OSF: number; OPMD?: number }): { statusCode: string } {
    const { OLP, OLK, OSF } = deep;
    const max = Math.max(OLP, OLK, OSF);
    if (max === 0) return { statusCode: 'OPMD_NEGATIVE' };
    if (max === OLP) return { statusCode: 'OLP_POSITIVE' };
    if (max === OLK) return { statusCode: 'OLK_POSITIVE' };
    return { statusCode: 'OSF_POSITIVE' };
  }

  async getDiagnosisById(id: string): Promise<DiagnosisResult> {
    const { data, error } = await supabase
      .from('diagnoses')
      .select()
      .eq('id', id)
      .single();

    if (error || !data) {
      throw createError('Diagnosis not found', 404);
    }
    return fromDbFormat(data as DiagnosisRow);
  }

  async getDiagnosisByPatient(patientId: string): Promise<DiagnosisResult[]> {
    const { data, error } = await supabase
      .from('diagnoses')
      .select()
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row: any) => fromDbFormat(row as DiagnosisRow));
  }

  async deleteDiagnosis(id: string): Promise<void> {
    const { data, error } = await supabase
      .from('diagnoses')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw createError('Diagnosis not found', 404);
    }
  }
}