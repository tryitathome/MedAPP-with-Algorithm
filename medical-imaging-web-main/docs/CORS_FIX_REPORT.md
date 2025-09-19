# CORS 错误修复报告

## 问题描述

用户在"口腔黏膜潜在恶性疾病病灶可视化"界面中遇到图片加载失败的问题：

```
GET http://localhost:5050/uploads/segmented_1758074666214_seg_1758074655865_0dcfil.jpg 
net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin 200 (OK)
```

虽然服务器返回200状态码，但浏览器因为CORS策略阻止了响应。

## 根本原因

对比两个界面的代码发现：

### 成功的界面（"口腔黏膜潜在恶性疾病智能辅助诊断"）
- `DeepDetectionVisualization.tsx` 中的 `<img>` 标签使用了 `crossOrigin="anonymous"` 属性
- 这告诉浏览器进行匿名CORS请求

### 失败的界面（"口腔黏膜潜在恶性疾病病灶可视化"）
- 分割页面的 `<img>` 标签没有 `crossOrigin` 属性
- 浏览器进行的是普通跨域请求，被CORS策略阻止

## 修复方案

### 1. 前端修复
在 `apps/frontend/src/app/oral/segmentation/page.tsx` 中添加 `crossOrigin="anonymous"` 属性：

```tsx
<img 
  src={result.overlayImageUrl} 
  alt="分割叠加" 
  className="object-contain max-h-[420px]"
  crossOrigin="anonymous"  // 添加这行
  onLoad={() => console.log('[Segmentation Page] 图片加载成功:', result.overlayImageUrl)}
  onError={(e) => {
    console.error('[Segmentation Page] 图片加载失败:', result.overlayImageUrl);
    console.error('[Segmentation Page] 错误详情:', e);
  }}
/>
```

### 2. 后端CORS配置优化
改进 `apps/backend/src/server.ts` 中的静态文件CORS配置：

```typescript
app.use('/uploads', (req, res, next) => {
  // 为静态文件设置CORS头 - 允许多个来源和匿名请求
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'false'); // 匿名CORS请求不需要凭据
  next();
}, express.static(uploadsDir));
```

## 技术解释

### crossOrigin="anonymous"的作用
- 告诉浏览器进行匿名CORS请求
- 不发送cookies或其他凭据
- 服务器需要返回适当的CORS头来允许这种请求

### 为什么之前一个成功一个失败
- `DeepDetectionVisualization` 组件已经正确使用了 `crossOrigin="anonymous"`
- 分割页面缺少这个属性，导致CORS错误
- 两个界面访问的都是同一个后端静态文件服务

## 验证步骤

1. **重启后端服务**：确保CORS配置生效
2. **清除浏览器缓存**：避免缓存的CORS错误
3. **访问分割页面**：测试图片是否正常加载
4. **检查网络面板**：确认请求头包含 `Origin` 和响应头包含正确的CORS头

## 预期结果

修复后，分割页面的图片应该能够正常加载，不再出现 `net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` 错误。
