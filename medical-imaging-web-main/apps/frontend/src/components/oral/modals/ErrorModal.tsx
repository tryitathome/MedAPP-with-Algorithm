// src/components/oral/modals/ErrorModal.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useColors } from '@/config/colors';
import Modal from '@/components/ui/Modal';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string | null;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, message }) => {
  const colors = useColors();
  const isImportNotice = message?.startsWith('导入完成') ?? false;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isImportNotice ? '导入提示' : '操作失败'}
      maxWidth="lg"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <span className={`${colors.textPrimary} font-medium`}>
            {isImportNotice ? '导入完成，但有文件未被识别' : '请检查以下错误'}
          </span>
        </div>
        <div className={`${colors.textSecondary} space-y-2 mb-6`}>
          <p className="whitespace-pre-wrap break-words">
            {message ?? '无法完成请求，请检查前端和后端终端中的详细日志。'}
          </p>
          {!isImportNotice && (
            <p className="mt-4 text-sm">
              如果问题持续，请打开浏览器 F12 的 Console 和 Network 面板，并保留此错误文本。
            </p>
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-xl font-medium ${colors.buttonPrimary} ${colors.textLight} transition-colors`}
          >
            返回
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ErrorModal;
