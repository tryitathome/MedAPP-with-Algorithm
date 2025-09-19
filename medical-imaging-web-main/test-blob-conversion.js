// 测试 blob URL 到 base64 转换功能
const fs = require('fs');
const path = require('path');

console.log('=== Blob URL 转换测试 ===');

// 模拟前端的转换函数（Node.js 版本）
async function convertImageToBase64(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`测试图片不存在: ${imagePath}`);
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase().replace('.', '');
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
    const base64 = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    console.log(`✓ 成功转换图片: ${path.basename(imagePath)}`);
    console.log(`  - 文件大小: ${imageBuffer.length} bytes`);
    console.log(`  - MIME类型: ${mimeType}`);
    console.log(`  - Base64长度: ${base64.length} 字符`);
    console.log(`  - Data URL长度: ${dataUrl.length} 字符`);
    console.log(`  - Data URL前缀: ${dataUrl.substring(0, 50)}...`);
    
    return dataUrl;
  } catch (error) {
    console.error(`✗ 转换失败: ${error.message}`);
    throw error;
  }
}

// 测试后端验证函数
function validateBase64Image(dataUrl) {
  if (!dataUrl.startsWith('data:image/')) {
    return { valid: false, error: '无效的图片格式：不是 data:image/ 开头' };
  }
  
  const matches = dataUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches) {
    return { valid: false, error: '无效的 base64 图片格式' };
  }
  
  const [, ext, base64Data] = matches;
  
  try {
    // 验证 base64 是否有效
    Buffer.from(base64Data, 'base64');
    return { 
      valid: true, 
      ext, 
      size: base64Data.length,
      estimatedBytes: Math.floor(base64Data.length * 3 / 4)
    };
  } catch (error) {
    return { valid: false, error: '无效的 base64 数据' };
  }
}

async function runTest() {
  console.log('\n1. 测试本地图片转换...');
  
  // 使用示例图片路径
  const testImagePath = 'D:\\MyWorkSpace\\MedAPP\\MMDETECTION_mini\\ExamplePicture\\oral-1567.JPG';
  
  try {
    const dataUrl = await convertImageToBase64(testImagePath);
    
    console.log('\n2. 验证转换后的格式...');
    const validation = validateBase64Image(dataUrl);
    
    if (validation.valid) {
      console.log('✓ 格式验证通过');
      console.log(`  - 图片类型: ${validation.ext}`);
      console.log(`  - Base64 大小: ${validation.size} 字符`);
      console.log(`  - 预估文件大小: ${validation.estimatedBytes} bytes`);
    } else {
      console.log(`✗ 格式验证失败: ${validation.error}`);
    }
    
  } catch (error) {
    console.log(`测试失败: ${error.message}`);
  }
  
  console.log('\n3. 测试完成');
  console.log('\n修复说明:');
  console.log('- 前端现在会检测 blob URL 并自动转换为 base64');
  console.log('- 后端期望接收 "data:image/..." 格式的数据');
  console.log('- 转换后的数据会被保存到 uploads 目录');
  console.log('- 分割算法会处理保存的图片文件');
}

runTest();
