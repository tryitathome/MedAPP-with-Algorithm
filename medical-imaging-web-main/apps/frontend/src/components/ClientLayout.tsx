// src/components/ClientLayout.tsx
'use client';

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useColors } from "@/config/colors";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  
  return (
    <div className={`${colors.bgPrimary} min-h-screen flex flex-col`}>
      <Header />
      {children}
      {/* <Footer /> */}
    </div>
  );
}