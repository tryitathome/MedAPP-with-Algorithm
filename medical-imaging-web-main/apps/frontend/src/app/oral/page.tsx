// 展示页（进入口腔黏膜功能前的过渡页面）
'use client'
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useColors } from '@/config/colors';
import { ArrowRight, PauseCircle, XCircle } from 'lucide-react';

const AUTO_DELAY = 5000; // 5秒自动跳转

const OralShowcasePage: React.FC = () => {
  const colors = useColors();
  const router = useRouter();
  const [remaining, setRemaining] = useState(AUTO_DELAY);
  const [stopped, setStopped] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTsRef = useRef<number>(Date.now());

  // 启动或恢复倒计时
  useEffect(() => {
    if (stopped) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    startTsRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTsRef.current;
      const left = AUTO_DELAY - elapsed;
      setRemaining(left > 0 ? left : 0);
      if (left <= 0) {
        clearInterval(timerRef.current!);
        router.push('/oral/diagnosis');
      }
    }, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopped, router]);

  const seconds = (remaining / 1000).toFixed(1);
  const progress = 100 - (remaining / AUTO_DELAY) * 100;

  const handleBrowseIntro = () => {
    setStopped(true); // 停止自动跳转
  };

  const handleClose = () => {
    setStopped(true);
    router.push('/oral/diagnosis');
  };

  return (
    <main className={`${colors.bgPrimary} min-h-screen flex flex-col relative overflow-hidden`}>      
      {/* 背景动态光斑 */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-60 h-60 bg-pink-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <header className="text-center pt-16 pb-4">
        <h1 className={`text-4xl font-bold mb-4 ${colors.textPrimary}`}>口腔黏膜潜在恶性疾病智能平台</h1>
        <p className={`max-w-3xl mx-auto text-base leading-relaxed ${colors.textSecondary}`}>
          本平台融合多阶段深度视觉特征提取、自指导掩码生成的掩码重建自监督预训练等技术，对口腔黏膜潜在恶性疾病（OPMD）进行早期筛查与亚型评估，支持批量患者管理、图像压缩预处理、医学知识宣教、深度检测与辅助报告生成，旨在帮助临床实现更高效、早期、精准的智能辅助判读。
        </p>
      </header>

      {/* 内容区 */}
      <section className="flex-1 w-full max-w-7xl mx-auto px-6 pb-10 grid gap-8 md:grid-cols-2">
        {/* 左侧主图 */}
        <div className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-lg flex flex-col">
          <div className="p-4 flex-none flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">人机辅助对比</h2>
            <span className="text-md text-gray-300">有效提升人类专家判读水平</span>
          </div>
          <div className="flex-1 overflow-hidden flex items-center justify-center p-2">
            <img 
              src="/showroom/Human_AI_Compare1.png" 
              alt="人机对比示意" 
              className="max-h-[520px] object-contain rounded-md"
            />
          </div>
          <div className="p-4 text-[15px] text-gray-300 leading-relaxed border-t border-white/10 bg-white/5">
            本平台所用算法采用国内外领先的大规模口腔黏膜临床数据集进行开发。经过严格的多中心泛化性测试与人机对比实验，证明了其视觉判读能力达到或超越了单一资深口腔黏膜专家的判读水平（P &#60; 0.01）。在算法的辅助下，临床医师对于口腔黏膜潜在恶性疾病的判读能力显著提高（P &#60; 0.01），能够有效减少早期筛查中的漏诊现象。
          </div>
        </div>

        {/* 右侧上下双图 */}
        <div className="grid gap-8 grid-rows-2">
          <div className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-md flex flex-col">
            <div className="p-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">算法体系结构</h3>
              <span className="text-[15px] text-gray-300">自监督预训练</span>
            </div>
            <div className="flex-1 flex items-center justify-center p-2">
              <img 
                src="/showroom/AlgorithmArchitecture2.png" 
                alt="算法结构" 
                className="max-h-[240px] object-contain"
              />
            </div>
            <p className="px-4 pb-3 text-[15px] text-gray-300 leading-relaxed">
              分割模型采用自指导掩码生成的掩码重建自监督预训练的方式，基于平均师生模型，通过一致性约束和对比学习约束，抑制重建退化，提高编码器特征提取鲁棒性。
            </p>
          </div>
          <div className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-md flex flex-col">
            <div className="p-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">算法性能与对比</h3>
              <span className="text-[15px] text-gray-300">相比现有算法效果最优</span>
            </div>
            <div className="flex-1 flex items-center justify-center p-2">
              <img 
                src="/showroom/AlgorithmComparison.png" 
                alt="算法性能对比" 
                className="max-h-[240px] object-contain"
              />
            </div>
            <p className="px-4 pb-3 text-[15px] text-gray-300 leading-relaxed">
              对比全监督、其他自监督方法，本平台采用的分割算法诊断结果在Dice、mIoU和mPA指标上明显占优。相关成果已撰写论文发表于国际高水平期刊。
            </p>
          </div>
        </div>
      </section>

      {/* 底部控制栏 */}
      <footer className="w-full max-w-5xl mx-auto px-6 pb-12">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <div className="flex-1 w-full">
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-gray-300">
              {stopped ? '已暂停自动跳转，点击“关闭”进入正式筛查界面。' : `算法正在后台加载，将于 ${seconds}s 后跳转，可点击“浏览算法介绍”暂停。`}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleBrowseIntro}
              disabled={stopped}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1 border transition-colors ${
                stopped
                  ? 'border-gray-600 text-gray-400 cursor-not-allowed'
                  : 'border-indigo-400/60 text-indigo-200 hover:bg-indigo-500/10'
              }`}
            >
              <PauseCircle size={16} /> 浏览算法介绍
            </button>
            <button
              onClick={handleClose}
              className="px-5 py-2 rounded-md text-md font-medium flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow hover:opacity-90 transition"
            >
              <ArrowRight size={16} /> 关闭
            </button>
          </div>
        </div>
        <div className="mt-4 text-center text-[15px] text-gray-400">
          浙江大学 控制科学与工程学院 智能感知与检测研究所 生命健康检测团队
        </div>
      </footer>
    </main>
  );
};

export default OralShowcasePage;

//图片需放置于 <code class="px-1 bg-black/30 rounded">apps/frontend/public/showroom</code> 目录；若尚未复制，请将 <code>ShowRoom</code> 目录中的三张 PNG 拷贝后再访问本页以正常显示。