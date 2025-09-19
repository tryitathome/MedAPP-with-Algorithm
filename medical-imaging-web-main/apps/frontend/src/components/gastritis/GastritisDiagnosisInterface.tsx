// src/components/gastritis/GastritisDiagnosisInterface.tsx
'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useColors } from '@/config/colors';

// Component Imports
import GlassCard from '@/components/ui/GlassCard';
import ControlButtons from './ControlButtons';
import GastroscopyPanel from './panels/GastroscopyPanel';
import PathologyPanel from './panels/PathologyPanel';
import LabPanel from './panels/LabPanel';
import MultiModalPanel from './panels/MultiModalPanel';

// Modal Imports
import GastroscopyDetailModal from './modals/GastroscopyDetailModal';
import PathologyDetailModal from './modals/PathologyDetailModal'; // New
import LabDetailModal from './modals/LabDetailModal'; // New
import FinalReportModal from './modals/FinalReportModal'; // New
import ImagePopupModal from './modals/ImagePopupModal';

// Mock Data & Types
import { GastroscopyData, PathologyData, LabData, DiagnosisResult } from './types';
import { MOCK_GASTROSCOPY, MOCK_PATHOLOGY, MOCK_LAB, MOCK_DIAGNOSIS_RESULT } from './mockData';

const GastritisDiagnosisInterface: React.FC = () => {
  const colors = useColors();
  const router = useRouter();

  // State Management
  const [gastroscopyData, setGastroscopyData] = useState<GastroscopyData | null>(null);
  const [pathologyData, setPathologyData] = useState<PathologyData | null>(null);
  const [labData, setLabData] = useState<LabData | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal Visibility State
  const [isGastroscopyModalOpen, setGastroscopyModalOpen] = useState(false);
  const [isPathologyModalOpen, setPathologyModalOpen] = useState(false); // New
  const [isLabModalOpen, setLabModalOpen] = useState(false); // New
  const [isReportModalOpen, setReportModalOpen] = useState(false); // New
  const [imagePopup, setImagePopup] = useState<{src: string, title: string} | null>(null); // Updated for flexibility

  const handleFileUpload = (type: 'gastroscopy' | 'pathology' | 'lab') => {
    setIsLoading(true);
    setTimeout(() => {
      if (type === 'gastroscopy') setGastroscopyData(MOCK_GASTROSCOPY);
      if (type === 'pathology') setPathologyData(MOCK_PATHOLOGY);
      if (type === 'lab') setLabData(MOCK_LAB);
      setIsLoading(false);
    }, 1500);
  };

  const handleDiagnose = () => {
    setIsLoading(true);
    setTimeout(() => {
      setDiagnosisResult(MOCK_DIAGNOSIS_RESULT);
      setIsLoading(false);
    }, 2000);
  };

  const handleClear = () => {
    setGastroscopyData(null);
    setPathologyData(null);
    setLabData(null);
    setDiagnosisResult(null);
  };
  
  return (
    <div className={`min-h-screen ${colors.bgPrimary} relative overflow-hidden`}>
      {/* ... background ... */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* ... header ... */}
         <div className="text-center mt-12 mb-8">
          <h1 className={`text-4xl font-bold ${colors.textPrimary}`}>
            自身免疫性胃炎(AIG)自动化诊断平台
          </h1>
        </div>

        {/* Main Interface */}
        <div className="max-w-7xl mx-auto">
          <GlassCard className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data Panels */}
              <GastroscopyPanel 
                data={gastroscopyData} 
                onDetailsClick={() => setGastroscopyModalOpen(true)}
              />
              <PathologyPanel 
                data={pathologyData} 
                onDetailsClick={() => setPathologyModalOpen(true)} 
              />
              <LabPanel 
                data={labData} 
                onDetailsClick={() => setLabModalOpen(true)} 
              />
              <MultiModalPanel data={diagnosisResult} />
            </div>

            {/* Bottom Control Buttons */}
            <ControlButtons
              onUpload={handleFileUpload}
              onDiagnose={handleDiagnose}
              onClear={handleClear}
              onBack={() => router.push('/')}
              onViewReport={() => setReportModalOpen(true)} // New
              isLoading={isLoading}
              canDiagnose={!!gastroscopyData && !!pathologyData && !!labData && !diagnosisResult}
              showReportButton={!!diagnosisResult} // New
            />
          </GlassCard>
        </div>
      </div>
      
      {/* Modals */}
      <GastroscopyDetailModal
        isOpen={isGastroscopyModalOpen}
        onClose={() => setGastroscopyModalOpen(false)}
        data={gastroscopyData}
        onImageDoubleClick={(src) => setImagePopup({src, title: "胃镜图像大图"})}
      />
      
      <PathologyDetailModal
        isOpen={isPathologyModalOpen}
        onClose={() => setPathologyModalOpen(false)}
        data={pathologyData}
        onImageDoubleClick={(src) => setImagePopup({src, title: "病理图像大图"})}
      />

      <LabDetailModal
        isOpen={isLabModalOpen}
        onClose={() => setLabModalOpen(false)}
        data={labData}
      />

      <FinalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
      
      <ImagePopupModal
        isOpen={!!imagePopup}
        onClose={() => setImagePopup(null)}
        imageSrc={imagePopup?.src ?? null}
        title={imagePopup?.title ?? ''}
      />
    </div>
  );
};

export default GastritisDiagnosisInterface;