# 口腔黏膜潜在恶性疾病智能诊断平台开发与运行指南

本文档说明 MedAPP 口腔模块的当前架构、运行方式、患者与诊断数据持久化、私有图片存储，以及三套本地 AI 算法的调用方式。

当前诊断流程：

1. 智能早期筛查：二分类模型；
2. 进一步辅助诊断：YOLO 检测 OLK、OLP、OSF，生成检测框及综合 OPMD 结果；
3. 病灶区域分割：MMDetection/Mask2Former 实例分割。

> 本系统属于辅助诊断软件原型，不应作为独立临床诊断依据。提交、存储或展示患者数据时必须遵守适用的隐私、伦理和医疗数据管理要求。

---

## 1. 项目结构

从 `MedAPP` 工作区根目录观察：

| 模块 | 目录 | 主要入口 | 当前用途 |
|---|---|---|---|
| Web Monorepo | `medical-imaging-web-main/` | `yarn dev` | Next.js 前端、Express 后端、共享类型及 Supabase migrations |
| 初筛分类 | `Classify-LM-Simple-OralImages/` | `classify_image.py` | 真实二分类推理 |
| 深度检测 | `YOLO12-Simplified-OralImages/` | `Yolo12Inference.py` | OLK/OLP/OSF 检测、检测框和 JSON 输出 |
| 实例分割 | `MMDETECTION_mini/` | `image_demo.py` | Mask2Former 病灶实例分割 |

Web 应用目录：

```text
medical-imaging-web-main/
├── apps/
│   ├── frontend/       # Next.js，默认端口 3000
│   └── backend/        # Express，默认配置端口 5050
├── packages/           # 前后端共享类型和工具
├── supabase/migrations # 数据库及 Storage migrations
└── package.json        # Yarn Workspaces 命令
```

---

## 2. Windows 开发启动

推荐从 Windows PowerShell 启动，因为当前 Python 解释器配置为 Windows Conda 环境：

```powershell
cd C:\path\to\MedAPP\medical-imaging-web-main
yarn install
yarn dev
```

默认访问地址：

- 前端：`http://localhost:3000`
- 后端健康检查：`http://localhost:5050/health`
- 后端 API：`http://localhost:5050/api`

`yarn dev` 和 `yarn dev:all` 当前执行相同的前后端并发启动命令。也可以分别启动：

```powershell
yarn dev:frontend
yarn dev:backend
```

依赖通常只需安装一次。以下情况可能需要重新运行 `yarn install`：

- 删除或更换了 `node_modules`；
- `package.json` 或 `yarn.lock` 发生变化；
- 切换了 Node.js 主版本；
- 在 Windows 和 WSL 之间切换运行环境，尤其涉及原生依赖时。

不要在两个系统中共享一套不兼容的原生依赖缓存。当前项目和 Conda 路径以 Windows 运行方式为主。

---

## 3. 前端环境变量

文件：`apps/frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5050/api
```

该变量可以公开给浏览器，但只能包含 API 地址。任何 Supabase secret/service-role key 都不得放入前端，也不得使用 `NEXT_PUBLIC_` 前缀暴露。

修改 `.env.local` 后，应重新启动 Next.js 开发服务器。

---

## 4. 后端环境变量

文件：`apps/backend/.env`。模板见 `apps/backend/.env.example`。

### 4.1 基础配置

| 变量 | 作用 | 推荐开发值 |
|---|---|---|
| `PORT` | Express 监听端口 | `5050` |
| `FRONTEND_URL` | CORS 允许的前端地址 | `http://localhost:3000` |
| `NO_DB` | `true` 时强制使用进程内存数据库 | 使用 Supabase/MongoDB 时必须为 `false` |
| `DATA_BACKEND` | `memory`、`mongodb` 或 `supabase` | 按部署环境选择 |
| `STORAGE_BACKEND` | `local` 或 `supabase` | 使用云端私有图片时为 `supabase` |
| `MONGODB_URI` | MongoDB 连接地址 | 仅 MongoDB 模式需要 |

`NO_DB=true` 的优先级高于 `DATA_BACKEND`，即使写了 `DATA_BACKEND=supabase`，仍会使用内存模式且不会更新 Supabase 表。

### 4.2 Supabase 配置

```env
NO_DB=false
DATA_BACKEND=supabase
STORAGE_BACKEND=supabase

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=your-server-only-secret-key
SUPABASE_STORAGE_BUCKET=oral-images
SUPABASE_SIGNED_URL_TTL_SECONDS=300
```

兼容旧项目的变量名是 `SUPABASE_SERVICE_ROLE_KEY`。代码不读取 `SUPABASE_SERVICE_KEY`；类似下面的注释占位符本身不会生效：

```env
# SUPABASE_SERVICE_KEY=your-service-role-key-here
```

Supabase secret/service-role key 权限很高：

- 只能放在 `apps/backend/.env` 或服务器的 secret manager；
- 不得提交到 Git；
- 不得发送到前端；
- 泄露后应立即轮换；
- 浏览器只通过 Express API 访问数据。

数据访问结构：

```text
Browser → Express API → Supabase Database / private Storage
```

后端启动时会检查 Supabase，并对短暂连接失败重试三次；持续无法访问时后端会退出，不会静默切换到内存数据库。

### 4.3 Python 与超时配置

| 变量 | 作用 | 当前建议 |
|---|---|---|
| `PYTHON_EXE_PATH` | 分类 Python | 指向 `oral_classify` 环境的 `python.exe` |
| `CLASSIFY_TIMEOUT_MS` | 分类超时 | `180000` |
| `YOLO_PYTHON_EXE_PATH` | YOLO Python | 指向安装了 Ultralytics 的环境 |
| `YOLO_MODEL_PATH` | 可选 YOLO 权重覆盖 | 未设置时使用仓库默认权重 |
| `MMDET_PYTHON_EXE_PATH` | MMDetection Python | 指向安装了 PyTorch/MMCV/MMEngine/MMDetection 的环境 |
| `MMDET_DEVICE` | 分割设备 | `cpu` 或兼容 GPU 的 `cuda:0` |
| `MMDET_TIMEOUT_MS` | 分割超时 | `600000` |
| `MMDET_DIR` | 可选 MMDetection 目录覆盖 | 未设置时按工作区相对路径解析 |
| `MMDET_SCRIPT_PATH` | 可选分割脚本覆盖 | 默认 `MMDETECTION_mini/image_demo.py` |
| `MMDET_CONFIG_PATH` | 可选模型配置覆盖 | 默认项目 Mask2Former 配置 |
| `MMDET_WEIGHTS_PATH` | 可选分割权重覆盖 | 默认项目分割权重 |

RTX 50 系列需要支持相应 CUDA compute capability 的 PyTorch 构建。旧 PyTorch/MMCV 若提示 `sm_120 is not compatible`，应暂时使用 `MMDET_DEVICE=cpu`，或整体升级为互相兼容的 PyTorch、CUDA、MMCV 和 MMDetection 组合；仅安装新版 CUDA Toolkit 不会修复旧 PyTorch wheel。

---

## 5. Supabase 数据库与 migrations

按文件名顺序在 Supabase SQL Editor 执行 `supabase/migrations/` 中的脚本：

1. `20260724000000_create_medapp_schema.sql`
2. `20260727000000_add_segmentation_image_object_path.sql`
3. `20260728000000_add_diagnoses_patient_fk.sql`

基础结构：

```text
patients
  id          uuid primary key          # 数据库内部标识
  patient_id  text unique not null       # 应用使用的患者标识

diagnoses
  id          uuid primary key
  patient_id  text not null
              foreign key → patients.patient_id
```

外键行为：

- 更新 `patients.patient_id`：`ON UPDATE CASCADE`；
- 删除仍有诊断记录的患者：`ON DELETE RESTRICT`；
- 添加外键前若存在孤立 diagnosis，migration 会失败并要求先修复数据。

诊断图片字段：

| 字段 | 内容 |
|---|---|
| `image_object_path` | 输入图片在私有 bucket 中的 object path |
| `annotated_image_object_path` | YOLO 检测框结果 object path |
| `segmentation_image_object_path` | MMDetection 分割结果 object path |

YOLO 和分割结果使用独立列，分割不会覆盖检测框图片路径。

`patients` 和 `diagnoses` 启用 RLS，但 migrations 不创建宽松的 `anon`/`authenticated` policy。Express 使用服务器 secret key 访问；不要为了方便添加允许所有用户读写的 RLS policy。

---

## 6. 私有 Storage 与本地临时文件

Supabase bucket：`oral-images`，必须保持 `public=false`。

对象结构：

```text
oral-images/
├── inputs/   # 上传的输入图片
└── results/  # YOLO、MMDetection 等结果图片
```

数据库只保存 object path，不保存 public URL 或 signed URL。API 返回响应时才生成短期 signed URL，默认有效期由 `SUPABASE_SIGNED_URL_TTL_SECONDS=300` 控制。

即使启用 Supabase Storage，后端仍保留本地文件，因为分类、YOLO 和 MMDetection Python 脚本都从本地路径读取图片：

```text
浏览器上传
  ├─→ backend/uploads/ 本地文件 → Python 推理
  └─→ Supabase private Storage → 持久存储
```

本地路径不是云端持久化记录的替代品；Storage object path 才写入数据库。

大小限制：

- 前端选择单图时允许最高 50 MB，然后按当前配置压缩；
- multipart 上传接口限制为 10 MB；
- Supabase bucket migration 的单对象限制为 10 MB；
- 支持 JPEG、PNG 和 WebP。

---

## 7. 患者导入与持久化

### 7.1 单张图片

```text
选择 File
→ 校验并压缩
→ 创建匿名应用患者
→ 保留后端返回的 patient_id
→ 选择图片状态
→ 开始分类/诊断
```

单图上传后即创建匿名患者，而不是等诊断完成后再猜测患者身份。诊断使用该应用 `patient_id`。

### 7.2 文件夹导入

文件夹名称格式：

```text
患者姓名-主病案号-病名-YYMMDD-Y/N(-可选备注)
```

例如：

```text
张三-88888888-口腔扁平苔藓-250101-N-无标注
```

也支持患者文件夹中的 `metadata.json`、`patient.json`、`patient.txt`、`metadata.txt` 或 `patient.meta`。

正确处理顺序：

```text
原始 File/webkitRelativePath
→ 只解析一次患者元数据
→ 查询患者；404 表示不存在
→ 不存在则创建，已存在则复用
→ 把应用 patient_id 附加到每张图片
→ 压缩图片
→ 使用保留的 patient_id 诊断
```

压缩后的 `File` 通常没有 `webkitRelativePath`，因此代码使用 `{ file, patientId }` 显式保留身份，不会在压缩后重新解析路径。同一患者文件夹只创建一次患者，多张图片共享相同 `patient_id`。

应用层 `patient_id` 与 Supabase `patients.id` UUID 不同。当前 API 和 `DiagnosisResult.patientId` 继续使用应用 `patient_id`。

---

## 8. 三阶段诊断数据流

### 8.1 初筛分类

```text
POST /api/upload/image       # multipart 字段 image
→ 本地 uploads 文件 + 可选 Supabase inputs object
→ POST /api/diagnosis/oral
→ DiagnosisService.analyzeOral
→ classify_image.py
→ 保存 type='oral' diagnosis
```

真实 `analyzeOral` 推理路径是主路径，不应替换为 `analyzeOralDummy`。

### 8.2 YOLO 深度检测

```text
POST /api/diagnosis/oral/deep
→ Yolo12Inference.py --single-json
→ 解析 detections
→ 计算 OLK / OLP / OSF / OPMD
→ 上传检测框图片
→ 保存 type='oral-deep' diagnosis
→ annotated_image_object_path
```

`Ultralytics` Python 包提供 YOLO 的模型加载、训练、验证和推理引擎；本仓库的 YOLO 脚本负责项目参数和结果转换。

### 8.3 MMDetection 分割

“病灶区域分割”按钮只在深度检测成功且获得 diagnosis UUID 后启用。跳转参数包括：

```text
/oral/segmentation?image=...&diagnosisId=...&patientId=...
```

分割页：

```text
blob URL → base64
→ POST /api/segmentation
→ 保存本地临时输入
→ image_demo.py / Mask2Former
→ 上传结果到 private Storage
→ 更新现有 oral-deep diagnosis
→ segmentation_image_object_path
→ API 返回短期 signed URL
```

分割不会创建重复 diagnosis，也不会覆盖 `annotated_image_object_path`。

---

## 9. 前端页面

| 路径 | 功能 |
|---|---|
| `/oral` | 口腔模块介绍及跳转 |
| `/oral/diagnosis` | 单图/文件夹导入、初筛、深度检测、报告展示 |
| `/oral/segmentation` | MMDetection 分割和结果展示 |

错误弹窗会显示真实错误文本。浏览器问题应同时检查 F12：

- `Console`：前端异常及请求地址；
- `Network`：请求状态码与后端响应；
- 后端终端：Python stderr、数据库、Storage 和超时错误。

后端正常的 patient GET/POST 不一定产生大量终端日志，因此应以 Network 响应和 Supabase 表数据为准。

---

## 10. Python 环境建议

建议分别创建环境，避免 PyTorch、Ultralytics、MMCV 版本冲突：

```powershell
# 分类环境：版本应优先按照分类仓库 environment.yml
conda env create -n oral_classify -f Classify-LM-Simple-OralImages\environment.yml

# YOLO 环境：版本应优先按照 YOLO Readme/environment.yml
conda create -n oral_yolo python=3.10 -y
conda activate oral_yolo
pip install ultralytics opencv-python

# MMDetection 环境必须使用互相兼容的 PyTorch/MMCV/MMEngine/MMDetection
conda create -n mmdetection python=3.10 -y
conda activate mmdetection
```

不要盲目安装最新版本。提供的权重可能依赖训练时的框架版本；优先根据 environment 文件、checkpoint metadata 和官方兼容矩阵确定版本。

`mmcv` 源码构建失败时，不要直接反复 `pip install mmcv==...`。应优先选择与当前 PyTorch/CUDA 匹配的预编译 wheel，并确认 Python、PyTorch、MMCV 和 MMDetection 的兼容组合。

---


## 11. 上线前检查清单

| 项目 | 完成 |
|---|---|
| 前端 API 地址指向正确后端 | ☐ |
| 后端端口和 CORS 配置正确 | ☐ |
| `NO_DB`/`DATA_BACKEND`/`STORAGE_BACKEND` 组合正确 | ☐ |
| Supabase migrations 已按顺序执行 | ☐ |
| private bucket、RLS、外键检查通过 | ☐ |
| secret key 仅存在于后端 | ☐ |
| 三个 Python 路径和模型权重存在 | ☐ |
| 分类、YOLO、MMDetection 环境分别验证 | ☐ |
| 输入图、YOLO 图、分割图保存到不同 object path/列 | ☐ |
| 单图及文件夹患者持久化正确 | ☐ |
| TypeScript/backend builds 通过 | ☐ |
| Next.js production prerender 问题已处理 | ☐ |
| 患者隐私、备份及数据保留策略已确认 | ☐ |

---

## 12. 术语

| 缩写 | 全称 | 说明 |
|---|---|---|
| OPMD | Oral Potentially Malignant Disorders | 口腔潜在恶性疾病集合概念 |
| OLK | Oral Leukoplakia | 口腔白斑病 |
| OLP | Oral Lichen Planus | 口腔扁平苔藓 |
| OSF | Oral Submucous Fibrosis | 口腔黏膜下纤维化 |
| RLS | Row Level Security | PostgreSQL/Supabase 行级安全 |
| Object path | Storage 对象路径 | 持久化到数据库的路径，不是 public/signed URL |

---

## 13. 更新日志

### 2026-07-28

- 更新 Windows 启动方式、默认端口和依赖安装说明；
- 记录分类、YOLO、MMDetection 独立 Python 环境及 CPU fallback；
- 增加 memory/MongoDB/Supabase repository 模式说明；
- 增加 patients、diagnoses、外键和 migrations 说明；
- 增加 private Supabase Storage、object path 和 signed URL 说明；
- 记录单图及文件夹患者在压缩前后的身份保留逻辑；
- 修正真实 diagnosis API 路径；
- 区分 YOLO detection 图片和 MMDetection segmentation 图片字段；
- 说明三个算法目录均不包含完整私有训练数据集；
- 增加当前已知构建和网络问题。

---

文档版本：v2.0
更新日期：2026-07-28
维护人：口腔黏膜智能诊断模块研发团队
