// hooks/useBatchPatientManagement.ts
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Patient } from '@shared/types';
import { PatientFolderInfo } from '@/utils/folderParser';

interface PatientWithImages extends Patient {
  images: File[];
  currentImageIndex: number;
  folderInfo?: PatientFolderInfo;
}

interface UseBatchPatientManagementReturn {
  // 患者级别状态
  patients: PatientWithImages[];
  currentPatientIndex: number;
  currentPatient: PatientWithImages | null;
  totalPatients: number;
  
  // 图片级别状态
  currentImageIndex: number;
  currentImage: File | null;
  currentImageUrl: string | null;
  totalImages: number; // 当前患者的图片总数
  
  // 导航控制
  canNavigatePrevPatient: boolean;
  canNavigateNextPatient: boolean;
  canNavigatePrevImage: boolean;
  canNavigateNextImage: boolean;
  
  // 患者导航
  handlePrevPatient: () => void;
  handleNextPatient: () => void;
  goToPatient: (index: number) => void;
  
  // 图片导航
  handlePrevImage: () => void;
  handleNextImage: () => void;
  goToImage: (index: number) => void;
  
  // 批量导入
  importPatients: (patientFolders: PatientFolderInfo[]) => void;
  addSinglePatient: (file: File, patientInfo?: PatientFolderInfo) => void;
  clear: () => void;
  
  // 辅助方法
  getCurrentPatientInfo: () => string;
  getCurrentImageInfo: () => string;
  isReady: boolean;
}

// 将PatientFolderInfo转换为Patient格式
function convertToPatient(folderInfo: PatientFolderInfo): PatientWithImages {
  return {
    id: `${folderInfo.caseNumber}-${Date.now()}`,
    name: folderInfo.name,
    index: folderInfo.caseNumber,
    history: folderInfo.diagnosis,
    date: folderInfo.date,
    biopsyConfirmed: folderInfo.hasBiopsy,
    doctor: 'N/A',
    images: folderInfo.images,
    currentImageIndex: 0,
    folderInfo
  };
}

export const useBatchPatientManagement = (): UseBatchPatientManagementReturn => {
  const [patients, setPatients] = useState<PatientWithImages[]>([]);
  const [currentPatientIndex, setCurrentPatientIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<Map<File, string>>(new Map());
  
  // 【修改】过滤掉占位符患者，只返回真实患者给用户界面
  const realPatients = patients.filter(p => p.id !== 'placeholder-patient');
  const currentPatient = patients[currentPatientIndex] || null;
  
  // 如果当前是占位符患者，在界面上显示为第一个真实患者
  const displayCurrentPatientIndex = currentPatient?.id === 'placeholder-patient' && realPatients.length > 0 
    ? 1 
    : realPatients.findIndex(p => p.id === currentPatient?.id) + 1;
  
  const currentImageIndex = currentPatient?.currentImageIndex || 0;
  const currentImage = currentPatient?.images[currentImageIndex] || null;
  
  // 获取当前图片URL - 添加调试信息
  const currentImageUrl = useMemo(() => {
    if (!currentImage) return null;
    const url = imageUrls.get(currentImage) || null;
    console.log('[BatchPatientManagement] currentImageUrl:', url, 'for image:', currentImage?.name);
    return url;
  }, [currentImage, imageUrls]);
  
  // 创建图片URL - 移除imageUrls依赖以避免无限循环
  const createImageUrl = useCallback((file: File): string => {
    let url: string | undefined;
    
    setImageUrls(prev => {
      if (prev.has(file)) {
        url = prev.get(file);
        return prev;
      }
      url = URL.createObjectURL(file);
      console.log('[BatchPatientManagement] 创建新的图片URL:', url, 'for:', file.name);
      return new Map(prev).set(file, url);
    });
    
    return url!;
  }, []);
  
  // 患者导航 - 修改为跳过占位符患者
  const handlePrevPatient = useCallback(() => {
    // 如果当前是第一个真实患者，无法向前
    if (currentPatientIndex <= 1) return;
    
    const newIndex = currentPatientIndex - 1;
    // 如果新索引是占位符，再向前一个
    const targetIndex = patients[newIndex]?.id === 'placeholder-patient' ? newIndex - 1 : newIndex;
    if (targetIndex >= 0) {
      console.log('[BatchPatientManagement] 切换到上一个患者:', targetIndex, patients[targetIndex]?.name);
      setCurrentPatientIndex(targetIndex);
    }
  }, [currentPatientIndex, patients]);
  
  const handleNextPatient = useCallback(() => {
    let nextIndex = currentPatientIndex + 1;
    // 如果下一个是占位符，跳过
    if (patients[nextIndex]?.id === 'placeholder-patient') {
      nextIndex++;
    }
    
    if (nextIndex < patients.length) {
      console.log('[BatchPatientManagement] 切换到下一个患者:', nextIndex, patients[nextIndex]?.name);
      setCurrentPatientIndex(nextIndex);
    }
  }, [currentPatientIndex, patients]);
  
  const goToPatient = useCallback((index: number) => {
    if (index >= 0 && index < patients.length) {
      setCurrentPatientIndex(index);
    }
  }, [patients.length]);
  
  // 图片导航
  const handlePrevImage = useCallback(() => {
    if (!currentPatient) return;
    
    if (currentPatient.currentImageIndex > 0) {
      const newImageIndex = currentPatient.currentImageIndex - 1;
      console.log('[BatchPatientManagement] 切换到上一张图片:', newImageIndex, 'of patient:', currentPatient.name);
      setPatients(prev => prev.map((patient, idx) => 
        idx === currentPatientIndex 
          ? { ...patient, currentImageIndex: newImageIndex }
          : patient
      ));
    }
  }, [currentPatient, currentPatientIndex]);
  
  const handleNextImage = useCallback(() => {
    if (!currentPatient) return;
    
    if (currentPatient.currentImageIndex < currentPatient.images.length - 1) {
      const newImageIndex = currentPatient.currentImageIndex + 1;
      console.log('[BatchPatientManagement] 切换到下一张图片:', newImageIndex, 'of patient:', currentPatient.name);
      setPatients(prev => prev.map((patient, idx) => 
        idx === currentPatientIndex 
          ? { ...patient, currentImageIndex: newImageIndex }
          : patient
      ));
    }
  }, [currentPatient, currentPatientIndex]);
  
  const goToImage = useCallback((index: number) => {
    if (!currentPatient || index < 0 || index >= currentPatient.images.length) return;
    
    setPatients(prev => prev.map((patient, idx) => 
      idx === currentPatientIndex 
        ? { ...patient, currentImageIndex: index }
        : patient
    ));
  }, [currentPatient, currentPatientIndex]);
  
  // 批量导入 - 修改为累积添加而不是覆盖
  const importPatients = useCallback((patientFolders: PatientFolderInfo[]) => {
    console.log('[BatchPatientManagement] importPatients 被调用, 新增患者数:', patientFolders.length, '当前已有患者数:', patients.length);
    patientFolders.forEach((p, idx) => {
      console.log(`[BatchPatientManagement] 新增患者 ${idx + 1}: ${p.name} (${p.caseNumber}) - 图片数: ${p.images.length}`);
    });
    
    const newPatients = patientFolders.map(convertToPatient);
    console.log('[BatchPatientManagement] 转换后的新患者:', newPatients);
    
    // 检查是否已有占位符患者
    const hasPlaceholder = patients.length > 0 && patients[0].id === 'placeholder-patient';
    
    if (hasPlaceholder) {
      // 如果已有占位符，直接追加新患者到现有列表后面
      const updatedPatients = [...patients, ...newPatients];
      console.log('[BatchPatientManagement] 追加新患者到现有列表，总患者数:', updatedPatients.length, '(含1个占位符)');
      
      setPatients(updatedPatients);
      // 自动切换到第一个新添加的患者
      const firstNewPatientIndex = patients.length; // 新患者的起始索引
      setCurrentPatientIndex(firstNewPatientIndex);
      console.log('[BatchPatientManagement] 自动切换到新添加的第一个患者，索引:', firstNewPatientIndex);
      
      // 立即为新添加的第一个患者的第一张图片创建URL
      if (newPatients.length > 0 && newPatients[0].images.length > 0) {
        const firstNewImage = newPatients[0].images[0];
        const url = URL.createObjectURL(firstNewImage);
        setImageUrls(prev => new Map(prev).set(firstNewImage, url));
        console.log('[BatchPatientManagement] 立即创建新患者第一张图片URL:', url, 'for:', firstNewImage.name);
      }
      
    } else {
      // 如果还没有患者（首次导入），创建占位符 + 新患者
      console.log('[BatchPatientManagement] 首次导入，创建占位符患者');
      
      // 清理旧的URL（虽然首次应该没有）
      imageUrls.forEach(url => URL.revokeObjectURL(url));
      setImageUrls(new Map());
      
      // 创建占位符患者
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(128,128,128,0.1)';
        ctx.fillRect(0, 0, 1, 1);
      }
      
      canvas.toBlob((blob) => {
        if (blob) {
          const placeholderFile = new File([blob], 'placeholder.png', { type: 'image/png' });
          const placeholderPatient: PatientWithImages = {
            id: 'placeholder-patient',
            name: '【系统占位】',
            index: '占位',
            history: '系统占位患者，请点击"下一个患者"查看真实数据',
            date: new Date().toISOString().split('T')[0],
            biopsyConfirmed: false,
            doctor: 'System',
            images: [placeholderFile],
            currentImageIndex: 0,
            folderInfo: {
              name: '【系统占位】',
              caseNumber: '占位',
              diagnosis: '系统占位患者',
              date: new Date().toISOString().split('T')[0],
              hasBiopsy: false,
              images: [placeholderFile],
              folderPath: 'placeholder'
            }
          };
          
          const allPatients = [placeholderPatient, ...newPatients];
          console.log('[BatchPatientManagement] 包含占位符的患者列表:', allPatients.length, '个患者（含1个占位符）');
          
          setPatients(allPatients);
          setCurrentPatientIndex(1); // 选中第一个真实患者
          
          // 为占位符图片创建URL
          const placeholderUrl = URL.createObjectURL(placeholderFile);
          setImageUrls(prev => new Map(prev).set(placeholderFile, placeholderUrl));
          
          // 立即为第一个真实患者的第一张图片创建URL
          if (newPatients.length > 0 && newPatients[0].images.length > 0) {
            const firstRealImage = newPatients[0].images[0];
            const url = URL.createObjectURL(firstRealImage);
            setImageUrls(prev => new Map(prev).set(firstRealImage, url));
            console.log('[BatchPatientManagement] 立即创建第一个真实患者的图片URL:', url, 'for:', firstRealImage.name);
          }
        }
      }, 'image/png');
    }
    
    // 为所有新患者的图片创建URL（延迟处理，避免阻塞UI）
    setTimeout(() => {
      newPatients.forEach(patient => {
        patient.images.forEach(image => {
          // 跳过已经创建URL的第一张图片
          if (newPatients.length > 0 && patient === newPatients[0] && image === newPatients[0].images[0]) {
            return;
          }
          createImageUrl(image);
        });
      });
    }, 0);
  }, [patients, imageUrls, createImageUrl]);
  
  // 添加单个患者
  const addSinglePatient = useCallback((file: File, patientInfo?: PatientFolderInfo) => {
    const patient: PatientWithImages = patientInfo 
      ? convertToPatient(patientInfo)
      : {
          id: `single-${Date.now()}`,
          name: '未知患者',
          index: 'N/A',
          history: '未知',
          date: new Date().toISOString().split('T')[0],
          biopsyConfirmed: false,
          doctor: 'N/A',
          images: [file],
          currentImageIndex: 0
        };
    
    setPatients([patient]);
    setCurrentPatientIndex(0);
    createImageUrl(file);
  }, [createImageUrl]);
  
  // 清空 - 清理所有患者包括占位符
  const clear = useCallback(() => {
    console.log('[BatchPatientManagement] 清空所有患者数据');
    // 清理所有URL
    imageUrls.forEach(url => URL.revokeObjectURL(url));
    setImageUrls(new Map());
    setPatients([]);
    setCurrentPatientIndex(0);
  }, []);
  
  // 辅助方法
  const getCurrentPatientInfo = useCallback((): string => {
    if (!currentPatient) return '无患者';
    return `${currentPatient.name} (${currentPatientIndex + 1}/${patients.length})`;
  }, [currentPatient, currentPatientIndex, patients.length]);
  
  const getCurrentImageInfo = useCallback((): string => {
    if (!currentPatient) return '无图片';
    return `第 ${currentImageIndex + 1} 张，共 ${currentPatient.images.length} 张`;
  }, [currentPatient, currentImageIndex]);
  
  // 当切换患者时，确保为当前图片创建URL - 移除createImageUrl依赖避免无限循环
  useEffect(() => {
    if (currentImage) {
      setImageUrls(prev => {
        if (!prev.has(currentImage)) {
          const url = URL.createObjectURL(currentImage);
          return new Map(prev).set(currentImage, url);
        }
        return prev;
      });
    }
  }, [currentImage]);
  
  // 清理组件卸载时的URL
  useEffect(() => {
    return () => {
      imageUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);
  
  return {
    // 患者级别状态 - 返回真实患者信息给界面
    patients: realPatients, // 只返回真实患者
    currentPatientIndex: Math.max(displayCurrentPatientIndex - 1, 0), // 转换为基于真实患者的索引
    currentPatient,
    totalPatients: realPatients.length, // 只计算真实患者数量
    
    // 图片级别状态
    currentImageIndex,
    currentImage,
    currentImageUrl,
    totalImages: currentPatient?.images.length || 0,
    
    // 导航控制 - 基于真实患者计算
    canNavigatePrevPatient: displayCurrentPatientIndex > 1,
    canNavigateNextPatient: displayCurrentPatientIndex < realPatients.length,
    canNavigatePrevImage: currentPatient ? currentImageIndex > 0 : false,
    canNavigateNextImage: currentPatient ? currentImageIndex < currentPatient.images.length - 1 : false,
    
    // 患者导航
    handlePrevPatient,
    handleNextPatient,
    goToPatient,
    
    // 图片导航
    handlePrevImage,
    handleNextImage,
    goToImage,
    
    // 批量导入
    importPatients,
    addSinglePatient,
    clear,
    
    // 辅助方法
    getCurrentPatientInfo,
    getCurrentImageInfo,
    isReady: realPatients.length > 0 // 基于真实患者数量判断
  };
};
