// src/components/ui/Modal.tsx
import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useColors } from '@/config/colors';
import GlassCard from './GlassCard';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  maxWidth = '4xl' 
}) => {
  const colors = useColors();
  
  if (!isOpen) return null;
  
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl'
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`${maxWidthClasses[maxWidth]} max-h-[90vh] w-full mx-4 relative`}>
        <GlassCard className="w-full overflow-hidden" padding="none">
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <h2 className={`text-2xl font-bold ${colors.textPrimary}`}>{title}</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${colors.buttonGhost} transition-colors`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
            {children}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Modal;