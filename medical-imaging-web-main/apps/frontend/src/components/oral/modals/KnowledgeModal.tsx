// src/components/oral/modals/KnowledgeModal.tsx
import React from 'react';
import { useColors } from '@/config/colors';
import Modal from '@/components/ui/Modal';
import { MarkdownRenderer } from '@/utils/markdownRenderer';

interface KnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeContent?: string;
}

const KnowledgeModal: React.FC<KnowledgeModalProps> = ({ 
  isOpen, 
  onClose, 
  knowledgeContent 
}) => {
  const colors = useColors();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="医学知识宣讲"
      maxWidth="4xl"
    >
      <div className="p-6 space-y-6">
        <div>
          {!knowledgeContent ? (
            <div className={`text-center ${colors.textSecondary} py-8`}>
              暂无医学知识内容
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <MarkdownRenderer content={knowledgeContent} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default KnowledgeModal;