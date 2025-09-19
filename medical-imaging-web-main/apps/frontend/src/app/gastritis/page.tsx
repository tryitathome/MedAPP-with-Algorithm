// src/app/gastritis/page.tsx
'use client'
import React from 'react';
import GastritisDiagnosisInterface from '@/components/gastritis/GastritisDiagnosisInterface';
import { useRouter } from 'next/navigation';

const GastritisPage: React.FC = () => {
  return <GastritisDiagnosisInterface />;
};

export default GastritisPage;