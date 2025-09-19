# 实例分割功能修复说明

## 问题诊断
用户遇到 400 "无效的图片格式" 错误，原因是：

- 前端传递给分割页面的是 blob URL（`blob:http://localhost:3000/...`）
- 后端期望接收 base64 格式的图片数据（`data:image/...`）
- 格式不匹配导致后端验证失败

## 修复方案
已实现 blob URL 到 base64 的自动转换和文件路径优化：

### 1. 前端修复（`apps/frontend/src/app/oral/segmentation/page.tsx`）

- 添加 `convertBlobToBase64` 函数，使用 FileReader API 转换 blob URL
- 在分割请求前自动检测并转换图片格式
- 更新"重新分割"按钮逻辑，支持 blob URL 处理

### 2. 调试信息增强（`apps/frontend/src/services/segmentation.ts`）

- 添加图片数据类型检测日志
- 便于追踪转换过程和问题排查

### 3. 后端文件路径优化（`apps/backend/src/services/segmentation.service.ts`）

- 修改输出文件保存策略：算法输出到临时目录，然后复制到 uploads 目录
- 使用时间戳前缀避免文件名冲突（`segmented_${timestamp}_${原文件名}`）
- 更新 URL 路径为 `/uploads/` 静态文件访问路径
- 优化清理函数，同时清理临时和最终目录

## 数据流程

1. 用户在诊断页面完成三分类检测
2. 点击"病灶区域分割"按钮
3. 跳转到分割页面，携带 blob URL 参数
4. **新增**：自动检测 blob URL 并转换为 base64
5. 发送 base64 数据到后端 `/api/segmentation`
6. 后端保存图片到 `uploads` 目录
7. 调用 MMDETECTION 算法，输出到临时目录
8. **新增**：将分割结果复制到 `uploads` 目录
9. 返回 `/uploads/segmented_xxx.jpg` URL 并在前端显示

## 测试验证
运行测试脚本验证转换功能：

```bash
cd "D:\MyWorkSpace\MedAPP\medical-imaging-web-main"
node test-blob-conversion.js
node test-segmentation-paths.js
```

## 环境配置确认

- ✅ Python 环境：`C:\Users\tryitathome\.conda\envs\MMDETECTION\python.exe`
- ✅ 推理脚本：`D:\MyWorkSpace\MedAPP\MMDETECTION_mini\image_demo.py`
- ✅ 配置文件：`D:\MyWorkSpace\MedAPP\MMDETECTION_mini\eval_ZJY_1102_mask2\mask2former_swin_s.py`
- ✅ 模型权重：`D:\MyWorkSpace\MedAPP\MMDETECTION_mini\eval_ZJY_1102_mask2\Swing-S-75000-best-data.pth`

## 测试步骤

1. 重启前后端服务
2. 进入口腔黏膜诊断页面
3. 上传图片并完成二分类检测
4. 点击"进一步辅助诊断"完成三分类
5. 点击"病灶区域分割"按钮
6. 验证分割页面是否正常显示处理结果

## 预期结果

- 前端控制台显示：`[Segmentation] 开始分割请求, 图片数据类型: base64`
- 网络请求显示：POST <http://localhost:5050/api/segmentation> 200
- 后端控制台显示分割命令执行过程
- `apps/backend/uploads` 目录下生成输入图片文件
- `MMDETECTION_mini/eval_results/vis` 目录下生成临时分割图
- `apps/backend/uploads` 目录下生成最终分割结果（`segmented_xxx.jpg`）
- 分割页面正确显示原图和分割结果

## 技术要点

- 使用 FileReader API 进行客户端 blob 到 base64 转换
- 保持与现有后端 API 接口的兼容性
- 添加详细的调试日志便于问题追踪
- 支持重新分割功能
- 文件复制策略确保结果可通过后端静态文件服务访问
- 时间戳命名避免文件冲突
