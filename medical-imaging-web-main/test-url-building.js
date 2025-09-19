// 测试新的 URL 构建逻辑
console.log('=== URL 构建逻辑测试 ===\n');

// 模拟前端环境变量
const NEXT_PUBLIC_BACKEND_URL = 'http://localhost:5050/api';
const BASE_API = NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050/api';

// 模拟 buildStaticUrl 函数
function buildStaticUrl(path) {
  // 绝对地址直接返回
  if (/^https?:/i.test(path)) return path;
  
  // 获取后端基址，但移除 /api 部分（用于静态资源）
  const rawApiBase = BASE_API;
  const staticBase = rawApiBase.replace(/\/api\/?$/, '');
  
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return staticBase + normalizedPath;
}

// 模拟 buildUrl 函数（用于 API 调用）
function buildUrl(path) {
  // 绝对地址直接返回
  if (/^https?:/i.test(path)) return path;

  const base = BASE_API.replace(/\/$/, '');
  const isBaseHttp = /^https?:/i.test(base);

  // 当 base 为绝对地址且以 /api 结尾，且 path 以 /api 开头时，去重拼接
  if (isBaseHttp && base.endsWith('/api') && path.startsWith('/api')) {
    return base + path.replace(/^\/api/, '');
  }
  // 其他情况直接拼接（处理 '/x' 与 '.../api' 的斜杠）
  return base + (path.startsWith('/') ? path : `/${path}`);
}

console.log('环境配置：');
console.log(`BASE_API: ${BASE_API}`);
console.log('');

console.log('API 调用 URL 测试（buildUrl）：');
const apiPaths = [
  '/api/segmentation',
  '/api/segmentation/environment'
];

apiPaths.forEach(path => {
  const result = buildUrl(path);
  console.log(`${path} → ${result}`);
});

console.log('\n静态资源 URL 测试（buildStaticUrl）：');
const staticPaths = [
  '/uploads/segmented_1757667082474_seg_1757667073270_ff88gj.jpg',
  'uploads/segmented_1757667082340_seg_1757667073285_m5dash.jpg',
  '/uploads/test.jpg'
];

staticPaths.forEach(path => {
  const result = buildStaticUrl(path);
  console.log(`${path} → ${result}`);
});

console.log('\n预期结果：');
console.log('- API 调用应该指向: http://localhost:5050/api/...');
console.log('- 静态资源应该指向: http://localhost:5050/uploads/...');
console.log('- 不应该出现: http://localhost:5050/api/uploads/...');

console.log('\n修复验证：');
const testPath = '/uploads/segmented_1757667082474_seg_1757667073270_ff88gj.jpg';
const finalUrl = buildStaticUrl(testPath);
console.log(`原始路径: ${testPath}`);
console.log(`最终URL: ${finalUrl}`);
console.log(`是否正确: ${finalUrl === 'http://localhost:5050/uploads/segmented_1757667082474_seg_1757667073270_ff88gj.jpg' ? '✓' : '✗'}`);
