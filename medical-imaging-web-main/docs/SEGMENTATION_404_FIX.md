# 实例分割图片显示 404 问题修复指南

## 问题现状
- 后端正确生成分割结果图片到 uploads 目录
- 后端返回正确的 URL 路径：`/uploads/segmented_xxx.jpg`
- 前端请求错误的 URL：`http://localhost:5050/api/uploads/...` (多了 /api)
- 应该请求：`http://localhost:5050/uploads/...`

## 修复已完成
1. ✅ 添加了 `buildStaticUrl` 函数处理静态资源 URL
2. ✅ 修改 `runSegmentation` 使用 `buildStaticUrl`
3. ✅ 添加了详细的调试日志
4. ✅ 后端文件复制逻辑正常工作

## 测试步骤

### 1. 手动验证静态文件可访问性
在浏览器中访问以下 URL，应该显示图片：
```
http://localhost:5050/uploads/segmented_1757667158925_seg_1757667151311_ldq04.jpg
http://localhost:5050/uploads/segmented_1757667082340_seg_1757667073285_m5dash.jpg
http://localhost:5050/uploads/segmented_1757667082474_seg_1757667073270_ff88gj.jpg
```

### 2. 前端调试验证
1. 重启前端服务（确保代码更新生效）
2. 打开浏览器开发者工具
3. 进入分割页面
4. 查看控制台输出，应该看到：
   ```
   [buildStaticUrl] 输入路径: /uploads/segmented_xxx.jpg
   [buildStaticUrl] 原始基址: http://localhost:5050/api
   [buildStaticUrl] 静态基址: http://localhost:5050
   [buildStaticUrl] 最终URL: http://localhost:5050/uploads/segmented_xxx.jpg
   [Segmentation] 后端返回的原始 URL: /uploads/segmented_xxx.jpg
   [Segmentation] 构建的最终 URL: http://localhost:5050/uploads/segmented_xxx.jpg
   ```

### 3. 网络请求验证
在浏览器 Network 面板中，应该看到：
- ✅ POST http://localhost:5050/api/segmentation (200)
- ✅ GET http://localhost:5050/uploads/segmented_xxx.jpg (200)
- ❌ 不应该看到 http://localhost:5050/api/uploads/... 的请求

## 如果仍有问题

### 情况 A：正确的 URL 返回 404
说明后端静态文件服务配置有问题，检查：
- apps/backend/src/server.ts 中的静态文件配置
- uploads 目录权限
- 后端端口 5050 是否正确运行

### 情况 B：前端仍然请求错误的 URL
说明前端代码更新未生效，尝试：
1. 完全重启前端开发服务器
2. 清除浏览器缓存
3. 检查是否有其他地方在构建 URL（如图片组件、其他服务文件）

### 情况 C：控制台没有调试日志
说明前端修改的代码没有生效，需要：
1. 确认文件保存
2. 重启开发服务器
3. 检查是否有 TypeScript 编译错误

## 快速测试命令
```bash
# 检查生成的文件
Get-ChildItem -Path "apps\backend\uploads" -Filter "segmented_*" | Sort-Object LastWriteTime -Descending | Select-Object -First 3

# 测试 URL 构建逻辑
node test-url-building.js

# 测试静态文件访问
node test-static-access.js
```

## 预期结果
- ✅ 分割算法正常执行
- ✅ 图片正确保存到 uploads 目录
- ✅ 前端显示分割结果图片
- ✅ 无 404 错误
