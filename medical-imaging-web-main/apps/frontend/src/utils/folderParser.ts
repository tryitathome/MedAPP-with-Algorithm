// utils/folderParser.ts

export interface PatientFolderInfo {
  name: string;
  caseNumber: string;
  diagnosis: string;
  date: string;
  hasBiopsy: boolean;
  /** 额外信息（可选，第六段），如 “无标注” */
  extraInfo?: string;
  folderPath: string;
  images: File[];
}

export interface BatchImportResult {
  patients: PatientFolderInfo[];
  errors: string[];
  totalImages: number;
}

/**
 * 解析文件夹名称格式：患者姓名-主病案号-病名-YYMMDD-Y/N(-可选额外信息)
 * 示例：张三-88888888-口腔扁平苔藓-250101-N-无标注
 */
export function parseFolderName(folderName: string): PatientFolderInfo | null {
  // 可选第六段（额外信息），允许含有中文、英文、数字与常见空格/下划线
  const pattern = /^(.+)-(\d+)-(.+)-(\d{6})-([YN])(?:-(.+))?$/;
  const match = folderName.match(pattern);
  
  if (!match) {
    return null;
  }
  
  const [, name, caseNumber, diagnosis, dateStr, biopsyFlag, extraInfo] = match;
  
  // 验证日期格式 YYMMDD
  const year = parseInt(dateStr.substring(0, 2)) + 2000;
  const month = parseInt(dateStr.substring(2, 4));
  const day = parseInt(dateStr.substring(4, 6));
  
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  
  const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  
  return {
    name: name.trim(),
    caseNumber: caseNumber.trim(),
    diagnosis: diagnosis.trim(),
    date: formattedDate,
    hasBiopsy: biopsyFlag === 'Y',
    extraInfo: extraInfo?.trim(),
    folderPath: folderName,
    images: []
  };
}

/**
 * 处理文件夹批量导入
 */
export async function processBatchImport(files: FileList): Promise<BatchImportResult> {
  const patients: PatientFolderInfo[] = [];
  const errors: string[] = [];
  const folderMap = new Map<string, PatientFolderInfo>();
  
  // 支持的图片格式
  const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = file.webkitRelativePath || file.name;
    const pathParts = filePath.split('/');
    
    if (pathParts.length < 2) {
      // 不是文件夹内的文件，跳过
      continue;
    }
    
    const folderName = pathParts[pathParts.length - 2]; // 倒数第二部分是文件夹名
    const fileName = pathParts[pathParts.length - 1];
    
    // 确保文件夹被创建（即使没有图片文件也可能有元数据）
    if (!folderMap.has(folderName)) {
      const patientInfo = parseFolderName(folderName);
      if (patientInfo) {
        folderMap.set(folderName, patientInfo);
      } else {
        // 即使文件夹名不符合规范，也先创建一个基础结构，等待元数据文件解析
        const basicInfo: PatientFolderInfo = {
          name: '待解析',
          caseNumber: '000000',
          diagnosis: '待解析',
          date: new Date().toISOString().split('T')[0],
          hasBiopsy: false,
          folderPath: folderName,
          images: []
        };
        folderMap.set(folderName, basicInfo);
      }
    }
    
    // 处理图片文件
    if (supportedImageTypes.includes(file.type)) {
      const patientInfo = folderMap.get(folderName);
      if (patientInfo) {
        patientInfo.images.push(file);
      }
    }
    // 注意：元数据文件将在 useFileUpload 中单独处理
  }
  
  // 转换为数组并过滤掉没有图片的患者
  for (const patientInfo of folderMap.values()) {
    if (patientInfo.images.length > 0) {
      patients.push(patientInfo);
    } else {
      errors.push(`文件夹 ${patientInfo.folderPath} 中没有找到有效的图片文件`);
    }
  }
  
  const totalImages = patients.reduce((sum, patient) => sum + patient.images.length, 0);
  
  return {
    patients: patients.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
    errors,
    totalImages
  };
}

/**
 * 从单个文件路径尝试解析患者信息
 */
export function parsePatientFromFilePath(file: File): PatientFolderInfo | null {
  const filePath = file.webkitRelativePath || file.name;
  const pathParts = filePath.split('/');
  
  if (pathParts.length < 2) {
    return null;
  }
  
  const folderName = pathParts[pathParts.length - 2];
  const patientInfo = parseFolderName(folderName);
  
  if (patientInfo) {
    patientInfo.images = [file];
  }
  
  return patientInfo;
}

/**
 * 解析患者元数据文件（JSON 或 文本格式）
 * 支持：
 *  1) JSON: {"name":"张三","caseNumber":"8888","diagnosis":"口腔扁平苔藓","date":"2025-01-01","biopsy":false,"extra":"无标注"}
 *  2) 文本单行模式: 张三-8888-口腔扁平苔藓-250101-N-无标注
 *  3) 文本多行键值: name:张三\ncaseNumber:8888\ndiagnosis:口腔扁平苔藓\ndate:2025-01-01\nbiopsy:N\nextra:无标注
 */
export async function parsePatientMetadataFile(file: File): Promise<PatientFolderInfo | null> {
  try {
    const raw = await file.text();
    const trimmed = raw.trim();
    let meta: any = null;

    // 优先 JSON
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        meta = JSON.parse(trimmed);
      } catch (e) {
        // ignore JSON parse error, fallback
      }
    }

    if (meta) {
      // 允许 date 为 YYYY-MM-DD 或 YYMMDD
      let dateStr: string = meta.date || meta.examDate || '';
      if (/^\d{6}$/.test(dateStr)) {
        const yy = parseInt(dateStr.slice(0,2), 10) + 2000;
        const mm = dateStr.slice(2,4);
        const dd = dateStr.slice(4,6);
        dateStr = `${yy}-${mm}-${dd}`;
      }
      if (!/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        // 若缺失则用今日
        const d = new Date();
        dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      }
      return {
        name: String(meta.name || meta.patientName || '未知患者'),
        caseNumber: String(meta.caseNumber || meta.caseNo || meta.index || '000000'),
        diagnosis: String(meta.diagnosis || meta.disease || '未指定诊断'),
        date: dateStr,
        hasBiopsy: Boolean(meta.biopsy === true || meta.biopsy === 'Y' || meta.biopsy === 'y'),
        extraInfo: meta.extra || meta.note || meta.remark,
        folderPath: file.name,
        images: []
      };
    }

    // 单行模式
    if (/^-?\s*.+-.+-.+-.+-.+/.test(trimmed) || trimmed.includes('-')) {
      const line = trimmed.split(/\r?\n/)[0];
      const p = parseFolderName(line.trim());
      if (p) return p;
    }

    // 键值对模式
    const kvLines = trimmed.split(/\r?\n/).filter(l => l.includes(':'));
    if (kvLines.length >= 2) {
      const map: Record<string,string> = {};
      for (const l of kvLines) {
        const [k,...rest] = l.split(':');
        map[k.trim().toLowerCase()] = rest.join(':').trim();
      }
      if (map['name'] || map['patientname']) {
        let dateStr = map['date'] || map['examdate'] || '';
        if (/^\d{6}$/.test(dateStr)) {
          const yy = parseInt(dateStr.slice(0,2), 10) + 2000;
          const mm = dateStr.slice(2,4);
            const dd = dateStr.slice(4,6);
          dateStr = `${yy}-${mm}-${dd}`;
        }
        if (!/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
          const d = new Date();
          dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        }
        return {
          name: map['name'] || map['patientname'] || '未知患者',
          caseNumber: map['casenumber'] || map['case'] || map['index'] || '000000',
          diagnosis: map['diagnosis'] || map['disease'] || '未指定诊断',
          date: dateStr,
          hasBiopsy: ['y','yes','true','1'].includes((map['biopsy']||'').toLowerCase()),
          extraInfo: map['extra'] || map['note'] || map['remark'],
          folderPath: file.name,
          images: []
        };
      }
    }
  } catch (e) {
    console.warn('解析患者元数据文件失败:', e);
  }
  return null;
}
