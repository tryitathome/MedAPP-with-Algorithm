# 口腔黏膜潜在恶性疾病自动化诊断模块开发记录文档

本文件聚焦于口腔黏膜潜在恶性疾病（OPMD）智能平台三阶段流程：

1. 智能早期筛查（二分类 / 初筛）
2. （进一步辅助诊断）→ 智能辅助诊断（三分类：OLK / OLP / OSF + 综合 OPMD 评分 + 深度检测 YOLO 可视化）
3. （病灶区域分割）→ 病灶可视化（实例分割 Mask2Former）

并补充：运行方式、端口、Python 环境、前端按钮与页面跳转逻辑、图片上传与结果展示数据流。

---

## 1. 运行与整体目录结构

根目录：`d:\MyWorkSpace\MedAPP`  
Web Monorepo：`medical-imaging-web-main/` (Yarn Workspaces)  
AI 模型及脚本：

| 模块 | 目录 | 主要脚本 | 权重/模型 | 说明 |
|------|------|----------|-----------|------|
| 二分类 / 三分类（初筛 + 多分类） | `Classify-LM-Simple-OralImages/` | `classify_image.py` | `best_model.pth` / `best_model_2class.pth` / `best_155epoch_shengkouV2.pt`（部分留存） | 由后端 `DiagnosisService.analyzeOral` 调用（分类） |
| 深度检测（YOLO 多类别检测+框+再计算最大得分） | `YOLO12-Simplified-OralImages/` | `Yolo12Inference.py` | `best_155epoch_shengkouV2.pt` | 后端 `analyzeOralDeep` 使用 `--single-json` 输出 |
| 病灶实例分割 | `MMDETECTION_mini/` | `image_demo.py` | `eval_ZJY_1102_mask2/*.pth` | 后端 `SegmentationService.runSegmentation` 调用 |

前后端（Next.js + Express）位于：`medical-imaging-web-main/apps/{frontend,backend}`

启动开发（默认前端 3000，后端  5050，见下文）：

```powershell
cd d:\MyWorkSpace\MedAPP\medical-imaging-web-main
yarn install
yarn dev           # 并发启动 frontend + backend（backend 端口=5000，若 .env 未覆盖）
# 或使用：yarn dev:all  # 强制 backend 端口=5050 且 NO_DB=true（跳过数据库）
```

生产打包（仅前后端构建，不含 Python 环境）：

```powershell
yarn build
```

---

## 2. 默认端口与环境变量

| 角色 | 默认端口 / 来源 | 说明 |
|------|----------------|------|
| 前端 Next.js | 3000（`apps/frontend/package.json` 中 `next dev --port 3000`） | 浏览器访问入口 |
| 后端 API  | yarn dev 情况下，无显式覆盖 |
| 后端（`yarn dev:all`） | 5050（脚本内设置 `$env:PORT=5050`） | 同时设置 `NO_DB=true`，适合算法联调 |
| 静态分割/上传图片访问 | 同后端端口(`/uploads/...`) | Express 静态中间件提供 |

关键环境变量（可放入根或 backend `.env`）：

| 变量 | 功能 | 备注 |
|------|------|------|
| `PORT` | 后端监听端口 | 决定 API 与 `/uploads` 服务端口 |
| `FRONTEND_URL` | CORS 白名单前端地址 | 默认 `http://localhost:3000` |
| `NO_DB` | =true 时跳过 MongoDB 连接 | 开发快速联调 |
| `PYTHON_EXE_PATH` | 分类脚本 Python 可执行路径（初筛+三分类） | 代码默认：`C:\Users\tryitathome\.conda\envs\LMCLASSIFY310\python.exe` |
| `YOLO_PYTHON_EXE_PATH` | 深度检测 YOLO Python 路径 | 若缺失回退到 `PYTHON_EXE_PATH` 或 `D:\MyPrograms\Python3.9.9\python.exe` |
| `YOLO_MODEL_PATH` | YOLO 权重路径 | 未设则使用项目默认 `best_155epoch_shengkouV2.pt` |

---

## 3. Python 环境与依赖位置（请本地创建并安装）

| 功能阶段 | 解释器路径（当前硬编码/默认） | 期望主要依赖 | 说明 |
|----------|----------------------------|-------------|------|
| 初筛（二分类）+ 三分类（OLK/OLP/OSF 逻辑分类脚本） | `C:\Users\tryitathome\.conda\envs\LMCLASSIFY310\python.exe` 或 `PYTHON_EXE_PATH` | `torch`, `torchvision`, `numpy`, 本地脚本 `classify_image.py` | 后端 `DiagnosisService.analyzeOral` 通过 `exec` 调用 |
| 深度检测（YOLO 推理） | `YOLO_PYTHON_EXE_PATH` > `PYTHON_EXE_PATH` > `D:\MyPrograms\Python3.9.9\python.exe` | `ultralytics`, `opencv-python`, `torch`, `numpy` | 脚本：`YOLO12-Simplified-OralImages/Yolo12Inference.py`，输出 JSON + 可视化图像 |
| 实例分割（Mask2Former / MMDetection） | `C:\Users\tryitathome\.conda\envs\MMDETECTION\python.exe` | `mmdet`, `mmengine`, `torch`, `opencv-python` 等 | 脚本：`MMDETECTION_mini/image_demo.py` |

建议：为三者分别建立 Conda 环境，避免依赖冲突。必要时可在文档末添加安装脚本模板。

---

## 4. 前端主要页面与路径

| 路径 | 文件 | 功能 |
|------|------|------|
| `/oral` | `apps/frontend/src/app/oral/page.tsx` | 过渡展示/介绍倒计时（5 秒自动跳转到 `/oral/diagnosis`） |
| `/oral/diagnosis` | `.../oral/diagnosis/page.tsx` + `OralDiagnosisInterface` | 初筛（二分类）→ 进一步辅助诊断（三分类 + 深度检测）入口与综合 UI |
| `/oral/segmentation` | `.../oral/segmentation/page.tsx` | 接收上一阶段图片 → 运行实例分割 → 展示叠加结果 |

---

## 5. 页面/按钮交互与跳转逻辑（核心流程）

### 5.1 总览流程（简化顺序图）

```text
用户选择图片/文件夹 -> 初筛检测(二分类/生成 finding & 建议) -> (按钮) 进一步辅助诊断 -> 深度检测(YOLO) -> 显示多分类+检测框 -> (按钮) 病灶区域分割 -> 跳转 /oral/segmentation -> 分割脚本 -> 叠加结果展示
```

### 5.2 关键按钮与触发函数（位于 `OralDiagnosisInterface`）

| 按钮/动作 | 位置/组件 | 触发函数 / 逻辑 | 结果 |
|-----------|-----------|------------------|------|
| 上传单张图片 | `ControlButtons` | `handleSingleFileUpload` → `useFileUploadWithCompression.handleFileUpload` | 读取 → 压缩 → base64 保存 state `selectedImage` |
| 批量上传患者文件夹 | `ControlButtons` | `handleFolderUpload` → `onBatchImport` | 解析文件夹 → 患者/多张图队列管理（批量导航） |
| 开始初筛 / 诊断 | 底部栏 `BottomControls` | `handleDetectionStart` | 后端调用（分类脚本）→ `diagnosisResponse` 填充 finding/recommendation/各分数 |
| 进一步辅助诊断 | 仅初筛完成且条件允许 | `handleStartDeepDetection` | 调用 `analyzeOralDeep`（YOLO），填充 `deepDetectionResults`，开启 `deepMode` |
| 病灶区域分割 | 深度检测完成后显示 | push 路由：`/oral/segmentation?image=<encodeURIComponent(selectedImage)>` | 进入分割页，自动发起 `runSegmentation` |
| 清空并返回（分割页） | `/oral/segmentation` 顶部按钮 | 清 sessionStorage + push `/oral/diagnosis` | 回到辅助诊断界面 |
| 返回（诊断界面） | `ControlButtons` 中 Back 行为 | `handleBackAction` | 清空模式、患者、状态回初始界面 |

### 5.3 `/oral/segmentation` 页自动逻辑

1. 读取 URL 参数 `image`（base64 / blob / 已上传 URL）
2. 若为 blob -> 转 base64（`convertBlobToBase64`）
3. 调用 `runSegmentation({ image: base64 })`
4. 后端：保存临时图片 → 调用分割脚本 → 复制结果到 `/uploads` → 返回 `overlayImageUrl`（相对路径）
5. 前端构建静态资源完整 URL（`buildStaticUrl`）加载展示

---

## 6. 图片上传与检测 / 分割数据流

### 6.1 初筛与辅助诊断（/oral/diagnosis）

```text
<input type=file> -> File 对象 -> (可压缩) -> base64 -> selectedImage
  ↓ 开始检测 (handleDetectionStart)
POST /api/diagnosis/oral  (或内部口腔分类接口，代码执行 classify_image.py)
  后端：
    - 从 imageUrl 或 /uploads 中文件名解析本地路径（若先走上传接口）
    - 若仅 base64 前端需要先显式 multipart 调用 /api/upload/image
    - exec Python 分类脚本 -> stdout JSON -> 解析 AI 结果 -> 组装 finding/recommendation/知识点
响应：diagnosisResponse.data.results (含 finding / recommendation / statusCode ...)
```

最佳实践：若需要后端持久存档或用于后续深度检测/分割，前端应先 `FormData` 调用：
`POST /api/upload/image` 字段名 `image` → 返回 `{ imageUrl: /api/upload/<filename> }`，此时 `diagnosisData.imageUrl` 使用该路径即可。

### 6.2 深度检测（YOLO）

```text
触发 handleStartDeepDetection -> POST /api/diagnosis/oral-deep (内部调用 analyzeOralDeep)
  后端：找到 uploads/<filename> -> exec YOLO 脚本 -> 输出 single_result.json / inference_results.jsonl
  解析：detections[] -> 计算每类最高置信度 -> 生成 OLP/OLK/OSF/OPMD 分数
  返回：deepDetectionResults（含 annotatedImage URL, detections, finding, recommendation 等）
前端：进入 deepMode，展示检测框可视化 + 多分类结果 + “病灶区域分割”按钮
```

### 6.3 分割（/oral/segmentation）

```text
前端：runSegmentation({ image: base64 })
POST /api/segmentation
  后端路径：segmentation.controller -> segmentationService.runSegmentation
    - 先保存 base64 -> 临时文件（uploadService.saveBase64Image）
    - exec Mask2Former (image_demo.py) -> 结果 vis/<原文件名>
    - 复制 -> backend/uploads/segmented_<timestamp>_<basename>.ext
    - 返回 overlayImageUrl: /uploads/segmented_....png
前端：buildStaticUrl -> <img src="http://localhost:5000/uploads/..."> 显示叠加图
```

### 6.4 静态文件访问差异说明

| 场景 | URL 示例 | 是否带 /api | 备注 |
|------|---------|-------------|------|
| 上传后获取图片 | `/api/upload/<filename>` | 是 | 走自定义路由（内部读取文件流） |
| 分割 / YOLO 结果展示 | `/uploads/segmented_xxx.png` | 否 | 直接由 Express 静态目录提供，使 `<img>` 跨域更直观 |

---

## 7. 后端主要相关代码索引

| 功能 | 文件 | 关键方法 / 内容 |
|------|------|----------------|
| Express 入口 & 静态目录 | `apps/backend/src/server.ts` | 端口、CORS、`/uploads` 静态服务 |
| 上传 API | `apps/backend/src/routes/upload.routes.ts` | `POST /api/upload/image` (multer) |
| 上传服务 | `apps/backend/src/services/upload.service.ts` | `processImage` / `saveBase64Image` |
| 初筛 + 分类诊断 | `apps/backend/src/services/diagnosis.service.ts` | `analyzeOral`（分类脚本）、结果文本生成 |
| 深度检测 YOLO | 同上 `analyzeOralDeep` | 解析 `single_result.json` 或 `inference_results.jsonl` |
| 分割 | `apps/backend/src/services/segmentation.service.ts` | `runSegmentation`、环境检查、缓存清理 |

---

## 8. 常见调试技巧

见对应位置的报错提示

---

## 9. 建议的未来改进（可选）

| 方向 | 建议 |
|------|------|
| 环境配置 | 将 Python 路径、模型文件改为集中 `config/*.json` 或 .env 动态加载，去除硬编码 |
| 任务队列 | 分割 / 深度检测使用异步任务（BullMQ / RabbitMQ），避免长时间阻塞 Node 事件循环 |
| 模型切换 | 前端提供下拉选择不同版本权重或阈值，后端通过参数透传 |
| 缓存策略 | 对同一图片 hash 后的结果缓存，减少重复推理 |
| 安全 | 上传文件类型与大小再加白名单校验，避免潜在脚本伪装 |

---

## 10. 附：环境快速创建（示例，仅供参考）

```powershell
# Conda 创建分类环境
conda create -n LMCLASSIFY310 python=3.10 -y
conda activate LMCLASSIFY310
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install numpy pillow opencv-python

# YOLO 环境（可与上合并，但建议独立）
conda create -n YOLO python=3.10 -y
conda activate YOLO
pip install ultralytics opencv-python torch torchvision numpy

# MMDetection 环境
conda create -n MMDETECTION python=3.10 -y
conda activate MMDETECTION
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
pip install mmengine mmdet==3.* opencv-python
```

> 注意：具体版本需与当前权重训练框架版本匹配，若出现算子不兼容请参考对应仓库 README。

---

## 11. 快速检查清单（上线/交付前）

| 项目 | 是否完成 | 备注 |
|------|----------|------|
| `.env` 端口与 Python 路径配置 | ☐ | `PORT / PYTHON_EXE_PATH / YOLO_PYTHON_EXE_PATH` |
| 模型权重存在性 | ☐ | 三套：分类 / YOLO / 分割 |
| `/uploads` 写入权限 | ☐ | Windows 下注意防病毒占用 |
| CORS 前端地址正确 | ☐ | 多端口多浏览器调试需添加 |
| 压缩流程正常 | ☐ | 大图 <10MB 后端限制内 |
| 深度检测结果含 annotatedImage | ☐ | 若无检查 YOLO 输出 JSON |
| 分割结果 URL 可直接 `<img>` 访问 | ☐ | 形如 `/uploads/segmented_*.png` |

---

## 12. 术语对照

| 缩写 | 全称 | 说明 |
|------|------|------|
| OPMD | Oral Potentially Malignant Disorders | 口腔黏膜潜在恶性疾病集合概念 |
| OLK | Oral Leukoplakia | 口腔白斑病 |
| OLP | Oral Lichen Planus | 口腔扁平苔藓 |
| OSF | Oral Submucous Fibrosis | 口腔黏膜下纤维化 |

---

## 13. 维护说明

更新本文件时，请保持：

1. 不在版本控制中泄露真实患者隐私数据；
2. 若新增模型或脚本，请在“Python 环境与依赖位置”表中追加；
3. 因重构变更 API 路径或上传策略，务必同步第 6 节数据流示意。
4. 

---

## 14. 更新日志

- 更新25.10.23

统一Python路径配置与修复后端路径别名解析

- 新增统一Python路径配置系统
  - 创建 python-paths.ts 配置加载器，支持环境变量和JSON配置文件
  - 添加 .env.example 和 python-paths.example.json 示例文件
  - 支持三种Python环境：classification, yoloDetection, segmentation

- 修复后端tsconfig路径别名
  - 更新 tsconfig.json 添加 @shared/* 通配别名
  - 引入 tsc-alias 和 tsconfig-paths 支持运行时路径解析
  - 修改 dev 和 build 脚本支持路径别名

- 重构服务层Python路径管理
  - diagnosis.service.ts: 移除硬编码路径，使用loadPythonPaths()
  - segmentation.service.ts: 移除硬编码路径，改为相对路径+环境变量可覆盖
  - 改进 checkEnvironment() 方法支持命令名和完整路径两种检查方式

- 更新文档
  - 在 A_ORAL_MODULE_DEVELOPER_GUIDE.md 添加Python路径配置章节
  - 说明配置优先级、示例和环境依赖

这些更改使代码能在不同机器上运行，无需修改硬编码路径。"

---

文档版本：v1.0  （生成日期：2025-10-23）  
维护人：口腔黏膜智能诊断模块研发团队
