// /config/constants.ts

export const APP_CONFIG = {
  name: '口腔黏膜潜在恶性疾病自动化诊断平台',
  version: '1.0.0',
  description: 'AI-powered oral mucosa diagnosis platform'
} as const;

export const DETECTION_CONFIG = {
  minDetectionTime: 2000, // 2 seconds minimum
  maxDetectionTime: 5000, // 5 seconds maximum
  supportedFormats: ['jpg', 'jpeg', 'png', 'bmp', 'tiff'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxBatchSize: 50, // Maximum number of images in batch
  imageQuality: 0.8
} as const;

export const UI_CONFIG = {
  animations: {
    defaultDuration: 300,
    slowDuration: 500,
    fastDuration: 150
  },
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280
  },
  zIndex: {
    modal: 50,
    dropdown: 40,
    overlay: 30,
    tooltip: 20
  }
} as const;

export const MEDICAL_CONDITIONS = {
  OLP: {
    code: 'OLP',
    name: '口腔扁平苔藓',
    englishName: 'Oral Lichen Planus',
    description: '口腔扁平苔藓是一种慢性炎症性疾病',
    riskLevel: 'medium',
    color: '#fbbf24'
  },
  OLK: {
    code: 'OLK',
    name: '口腔白斑病',
    englishName: 'Oral Leukoplakia',
    description: '口腔白斑病是一种潜在恶性疾病',
    riskLevel: 'high',
    color: '#ef4444'
  },
  OOML: {
    code: 'OOML',
    name: '口腔其他恶性病变',
    englishName: 'Other Oral Malignant Lesions',
    description: '口腔其他恶性病变需要进一步检查',
    riskLevel: 'high',
    color: '#dc2626'
  }
} as const;

export const DIAGNOSIS_THRESHOLDS = {
  high: 0.7,
  medium: 0.5,
  low: 0.3
} as const;

export const PATIENT_FOLDER_FORMAT = {
  pattern: /^(.+)-(\d{8})-(.+)-(\d{6})-([YN])$/,
  description: '患者姓名-主病案号-病名（历史诊断）-YYMMDD-Y有活检确认N无活检确认',
  example: '张三-88888888-口腔扁平苔藓-250101-N'
} as const;

export const ERROR_MESSAGES = {
  fileUpload: {
    invalidFormat: '不支持的文件格式',
    fileTooLarge: '文件大小超过限制',
    uploadFailed: '文件上传失败',
    noFileSelected: '请选择文件'
  },
  detection: {
    noImage: '请先选择图片',
    detectionFailed: '检测过程中出现错误',
    invalidResults: '检测结果无效',
    networkError: '网络连接错误'
  },
  patient: {
    invalidFolderName: '患者文件夹名称格式不正确',
    missingPatientInfo: '患者信息不完整',
    duplicatePatient: '患者信息重复'
  },
  report: {
    generationFailed: '报告生成失败',
    downloadFailed: '报告下载失败',
    printFailed: '报告打印失败',
    notConfirmed: '请确认医嘱后再操作'
  }
} as const;

export const SUCCESS_MESSAGES = {
  fileUpload: '文件上传成功',
  detection: '检测完成',
  reportDownload: '报告下载成功',
  reportPrint: '报告打印成功'
} as const;

export const ROUTES = {
  home: '/',
  oralShowcase: '/oral', // 新增：展示页（含自动跳转）
  oralDiagnosis: '/oral/diagnosis', // 修改：正式筛查与诊断页
  oralSegmentation: '/oral/segmentation', // 新增：实例分割页
  results: '/results',
  history: '/history',
  help: '/help'
} as const;

export const LOCAL_STORAGE_KEYS = {
  patientData: 'oral_diagnosis_patient_data',
  detectionResults: 'oral_diagnosis_results',
  userPreferences: 'oral_diagnosis_preferences'
} as const;

export const API_ENDPOINTS = {
  upload: '/api/upload',
  detect: '/api/detect',
  results: '/api/results',
  patients: '/api/patients',
  reports: '/api/reports'
} as const;

export const EDUCATIONAL_CONTENT = {
  oralLeukoplakia: {
    causes: [
      {
        title: '吸烟等理化刺激',
        description: '与白斑的发生密切相关，白斑的发生率与吸烟时间的长短及吸烟量呈正比关系。发病部位与烟接触口腔的方式、烟雾刺激的部位有关。'
      },
      {
        title: '与局部刺激有关',
        description: '饮酒、进食过烫或酸辣食物、嚼槟榔等均与白斑形成相关。食用刺激性食物如烫、辣、硬食会使上消化道黏膜组织发生不同程度的损伤。'
      }
    ],
    prevention: [
      '戒烟戒酒',
      '避免进食过烫或酸辣食物',
      '去除残根、残冠及不良修复体',
      '定期口腔检查'
    ],
    treatment: [
      '去除刺激因素',
      '药物治疗',
      '定期随访',
      '必要时手术治疗'
    ]
  }
} as const;

export const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 }
  },
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 }
  }
} as const;