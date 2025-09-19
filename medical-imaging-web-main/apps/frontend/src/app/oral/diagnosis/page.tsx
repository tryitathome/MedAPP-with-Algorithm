// 口腔黏膜潜在恶性疾病智能早期筛查主页面
'use client'
import React from 'react';
import { useColors } from '@/config/colors';
import OralDiagnosisInterface from '@/components/oral/OralDiagnosisInterface';

const OralDiagnosisPage: React.FC = () => {
  const colors = useColors();
  return (
    <main className={`${colors.bgPrimary} min-h-screen`}>
      <OralDiagnosisInterface />
    </main>
  );
};

export default OralDiagnosisPage;
