// src/components/gastritis/modals/FinalReportModal.tsx
import React from 'react';
import Modal from '@/components/ui/Modal';
import AnimatedButton from '@/components/ui/AnimatedButton';
import { Download, Printer } from 'lucide-react';
import { useColors } from '@/config/colors';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FinalReportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const colors = useColors();
  
  const handleDownload = () => console.log('Downloading report...');
  const handlePrint = () => console.log('Printing report...');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="报告查看与保存" maxWidth="4xl">
      <div className='p-2 bg-black/20'>
        {/* Placeholder for PDF Viewer */}
        <div className={`flex items-center justify-center h-[65vh] bg-gray-700 rounded-lg ${colors.textSecondary}`}>
            <p>检查报告PDF预览 [cite: 205]</p>
        </div>
      </div>
      <div className={`p-4 flex justify-end gap-4 border-t ${colors.glassBorder}`}>
        <AnimatedButton variant="ghost" onClick={handleDownload} showIcon={false}>
          <Download className='w-4 h-4 mr-2' />
          详细报告 [cite: 202]
        </AnimatedButton>
        <AnimatedButton onClick={handlePrint}>
          打印报告 [cite: 203]
        </AnimatedButton>
      </div>
    </Modal>
  );
};

export default FinalReportModal;