// src/components/oral/modals/ErrorModal.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useColors } from '@/config/colors';
import Modal from '@/components/ui/Modal';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage?: string | null;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, errorMessage }) => {
  const colors = useColors();
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="通用错误提示"
      maxWidth="lg"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <span className={`${colors.textPrimary} font-medium`}>哎呀！系统的后端界面爆炸了！</span>
        </div>
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className={`text-sm text-red-400 font-mono break-all`}>{errorMessage}</p>
          </div>
        )}
        <div className={`${colors.textSecondary} space-y-2 mb-6`}>
          <p>请检查造成这种错误的常见原因：</p>
          <p>（1）系统的前端界面（默认http://localhost:3000/）和后端界面（默认http://localhost:5050/）无法通讯，在浏览器按下F12键查看日志可以看到相关报错信息；</p>
          <p>（2）系统的后端界面未启动（在控制台看不见[BACKEND]字样），请使用终端导航至“MedAPP\medical-imaging-web-main”文件夹，键入“yarn dev”命令整体启动；</p>
          <p>（3）系统的后端界面崩溃了，需要你慢慢调试问题（yarn workspace medical-imaging-web-backend dev exited或者[BACKEND] [nodemon] app crashed ）；</p>
          <p>（4）计算机上未使用annaconda配置好进行OPMD检测与分类的两个python虚拟环境，或未给后端界面指定两个python.exe的位置→泡上一杯咖啡，解决该问题需要几个小时；</p>
          <p>（5）数据库爆炸了；</p>
          <p>（6）由于GPT-5，Claude 4和Gemini 2.5 Pro一起堆起来的屎山倒塌了而引发的其他未知错误，如果你来自未来的话，用它们的后辈修理一下前辈遗留下来的问题；</p>
          <p className="mt-4">请联系技术人员提供支持</p>
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