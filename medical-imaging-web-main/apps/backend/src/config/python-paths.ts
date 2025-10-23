// src/config/python-paths.ts
import fs from 'fs';
import path from 'path';

export interface PythonPathConfig {
  classification: string;    // 初筛 / 三分类
  yoloDetection?: string;    // 深度检测 YOLO
  segmentation?: string;     // 实例分割 (MMDetection)
}

const DEFAULT_RELATIVE_FILE = 'python-paths.json';

function readJsonIfExists(filePath: string): Partial<PythonPathConfig> | null {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[python-paths] 读取失败:', e);
  }
  return null;
}

export function loadPythonPaths(): PythonPathConfig {
  // 1. 环境变量优先
  const envConfig: Partial<PythonPathConfig> = {
    classification: process.env.PYTHON_EXE_PATH,
    yoloDetection: process.env.YOLO_PYTHON_EXE_PATH,
    segmentation: process.env.SEG_PYTHON_EXE_PATH
  };

  // 2. 允许在 backend 根目录或项目根目录放置配置文件
  const backendRoot = path.resolve(__dirname, '..');
  const projectRoot = path.resolve(backendRoot, '../../..'); // monorepo 根
  const candidateFiles = [
    path.join(backendRoot, DEFAULT_RELATIVE_FILE),
    path.join(projectRoot, DEFAULT_RELATIVE_FILE),
    path.join(projectRoot, 'apps', 'backend', DEFAULT_RELATIVE_FILE)
  ];

  let fileConfig: Partial<PythonPathConfig> = {};
  for (const file of candidateFiles) {
    const cfg = readJsonIfExists(file);
    if (cfg) {
      console.log(`[python-paths] 加载配置文件: ${file}`);
      fileConfig = { ...fileConfig, ...cfg };
    }
  }

  const merged: PythonPathConfig = {
    classification: envConfig.classification || fileConfig.classification || 'python',
    yoloDetection: envConfig.yoloDetection || fileConfig.yoloDetection || envConfig.classification || fileConfig.classification || 'python',
    segmentation: envConfig.segmentation || fileConfig.segmentation || envConfig.classification || fileConfig.classification || 'python'
  };

  console.log(`[python-paths] 最终配置: ${summarizePythonPaths(merged)}`);
  return merged;
}

export function summarizePythonPaths(cfg: PythonPathConfig): string {
  return `classification=${cfg.classification}; yoloDetection=${cfg.yoloDetection}; segmentation=${cfg.segmentation}`;
}
