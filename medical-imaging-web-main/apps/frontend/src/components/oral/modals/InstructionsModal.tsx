// src/components/oral/modals/InstructionsModal.tsx
import React from 'react';
import { useColors } from '@/config/colors';
import Modal from '@/components/ui/Modal';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  const colors = useColors();
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="图片批量导入说明"
      maxWidth="2xl"
    >
      <div className="p-6 space-y-4">
        <div className={`${colors.textSecondary} leading-relaxed`}>
          <p className="mb-4">你可以选择（1）上传完全匿名的单张图片进行检测（支持jpg, jpeg, png格式）；</p>
          <p className="mb-4">或者选择（2）上传某位患者按照方式排列好的图片文件夹。</p>
          <p className="mb-4">这个文件夹应该包含病人信息有关的.json文件，或者按照如下方式命名：</p>
          <div className="bg-white/5 p-4 rounded-lg font-mono text-sm mb-4">
            "患者姓名-主病案号-病名（历史诊断）-YYMMDD-Y有活检确认N无活检确认-其他信息"
          </div>
          <p className="mb-4">例如：张三-88888888-口腔扁平苔藓-250101-N-无标注</p>
          <p>系统将自动识别其内部图片与每个病人的信息。</p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-xl font-medium ${colors.buttonPrimary} ${colors.textLight} transition-colors`}
          >
            我已知晓
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InstructionsModal;