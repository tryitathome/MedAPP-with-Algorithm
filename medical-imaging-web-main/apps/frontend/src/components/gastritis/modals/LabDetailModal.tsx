// src/components/gastritis/modals/LabDetailModal.tsx
import React from 'react';
import Modal from '@/components/ui/Modal';
import { LabData } from '../types';
import { useColors } from '@/config/colors';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: LabData | null;
}

const LabDetailModal: React.FC<Props> = ({ isOpen, onClose, data }) => {
  const colors = useColors();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="实验室检验分析结果" maxWidth="4xl">
      <div className="p-6 space-y-8">
        <div>
          <h4 className={`text-lg font-bold ${colors.textPrimary} mb-3`}>实验室检验异常指标:</h4>
          <ul className="list-disc list-inside space-y-2 text-red-400">
            <li>抗内因子抗体: <span className='font-mono'>101.21</span> / &lt;20.00 [cite: 124]</li>
            <li>抗壁细胞抗体: <span className='font-mono'>55.8</span> / &lt;20.00 [cite: 125]</li>
          </ul>
        </div>
        
        {/* Mock SHAP/Feature Importance Chart */}
        <div>
           <h4 className={`text-lg font-bold ${colors.textPrimary} mb-3`}>模型贡献度分析 (SHAP):</h4>
           <div className="p-4 rounded-lg bg-black/20 space-y-3">
              <p className={colors.textSecondary}>此图表显示了各项指标对最终诊断结果的影响程度。</p>
              {/* This is a simplified visual representation of the SHAP chart from the PDF */}
              <img src="/images/shap-plot-mock.png" alt="SHAP Plot" className="w-full rounded-md" />
           </div>
        </div>

        <div className="pt-6 border-t border-white/20">
            <h4 className={`text-lg font-bold ${colors.textPrimary} mb-2`}>实验室检验分析结果:</h4>
            <p className={`font-semibold text-amber-300`}>
              {data?.analysisResult} [cite: 145]
            </p>
        </div>
      </div>
    </Modal>
  );
};

export default LabDetailModal;