// segmentation.ts - 前端实例分割服务调用封装

export interface SegmentationRequest {
  image?: string;     // dataURL base64
  imageUrl?: string;  // 服务器可访问的 URL
  options?: Record<string, any>;
}

export interface SegmentationResponse {
  overlayImageUrl: string; // 叠加显示的可视化结果
  maskImageUrl?: string;
  inferenceTimeMs?: number;
  modelVersion?: string;
  meta?: Record<string, any>;
}

// 统一后端 API 基址解析：优先读取 window.__BACKEND_URL__ 或 NEXT_PUBLIC_BACKEND_URL；
// 开发环境(端口3000)默认指向 http://localhost:5050/api，避免依赖 Next 重写导致 404。
const BASE_API = (
  (typeof window !== 'undefined' ? (window as any).__BACKEND_URL__ : undefined)
  || process.env.NEXT_PUBLIC_BACKEND_URL
  || (typeof window !== 'undefined' && window.location && window.location.port === '3000'
    ? 'http://localhost:5050/api'
    : '/api')
);

function buildUrl(path: string) {
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

// 构建静态资源 URL（用于图片等资源，不走 /api 路由）
function buildStaticUrl(path: string) {
  // 绝对地址直接返回
  if (/^https?:/i.test(path)) return path;
  
  // 获取后端基址，但移除 /api 部分（用于静态资源）
  const rawApiBase = BASE_API;
  const staticBase = rawApiBase.replace(/\/api\/?$/, '');
  
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const finalUrl = staticBase + normalizedPath;
  
  console.log('[buildStaticUrl] 输入路径:', path);
  console.log('[buildStaticUrl] 原始基址:', rawApiBase);
  console.log('[buildStaticUrl] 静态基址:', staticBase);
  console.log('[buildStaticUrl] 最终URL:', finalUrl);
  
  return finalUrl;
}

// 调用后端分割 API
export async function runSegmentation(req: SegmentationRequest): Promise<SegmentationResponse> {
  try {
    console.log('[Segmentation] 开始分割请求, 图片数据类型:', req.image?.startsWith('data:') ? 'base64' : req.image?.startsWith('blob:') ? 'blob URL' : '其他');
    
  const response = await fetch(buildUrl('/api/segmentation'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
    image: req.image,
    imageUrl: req.imageUrl,
        options: req.options
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `分割请求失败: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '分割失败');
    }

    console.log('[Segmentation] 后端返回的原始 URL:', result.data.overlayImageUrl);
    const finalUrl = buildStaticUrl(result.data.overlayImageUrl);
    console.log('[Segmentation] 构建的最终 URL:', finalUrl);

    return {
      // 使用 buildStaticUrl 处理静态资源路径，确保不会添加 /api 前缀
      overlayImageUrl: finalUrl,
      maskImageUrl: result.data.maskImageUrl,
      inferenceTimeMs: result.data.inferenceTimeMs,
      modelVersion: result.data.modelVersion,
      meta: result.data.meta
    };
  } catch (error: any) {
    console.error('Segmentation API error:', error);
    throw new Error(error.message || '分割服务调用失败');
  }
}

// 检查分割环境状态
export async function checkSegmentationEnvironment(): Promise<{ ready: boolean; message: string }> {
  try {
    const response = await fetch(buildUrl('/api/segmentation/environment'));
    
    if (!response.ok) {
      throw new Error(`环境检查失败: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error: any) {
    console.error('Environment check error:', error);
    return {
      ready: false,
      message: error.message || '环境检查失败'
    };
  }
}
