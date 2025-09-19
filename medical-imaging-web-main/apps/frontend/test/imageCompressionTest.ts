// test/imageCompressionTest.ts
import { compressImage, compressImages, formatFileSize } from '../src/utils/imageCompression';

// 这是一个简单的测试文件，用于验证图片压缩功能
// 在实际应用中，您可以在浏览器控制台中运行这些测试

/**
 * 测试单张图片压缩
 * 在浏览器中测试，需要用户选择文件
 */
export async function testSingleImageCompression() {
  console.log('=== 测试单张图片压缩 ===');
  
  // 创建文件输入元素
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  return new Promise((resolve) => {
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file) {
        console.log('未选择文件');
        resolve(null);
        return;
      }
      
      console.log('原始文件信息:');
      console.log(`- 文件名: ${file.name}`);
      console.log(`- 大小: ${formatFileSize(file.size)}`);
      console.log(`- 类型: ${file.type}`);
      
      try {
        const startTime = performance.now();
        
        const result = await compressImage(file, {
          maxWidth: 1600,
          maxHeight: 1200,
          maxSizeKB: 500,
          quality: 0.8
        });
        
        const endTime = performance.now();
        
        console.log('压缩结果:');
        console.log(`- 原始大小: ${formatFileSize(result.originalSize)}`);
        console.log(`- 压缩后大小: ${formatFileSize(result.compressedSize)}`);
        console.log(`- 压缩率: ${(result.compressionRatio * 100).toFixed(1)}%`);
        console.log(`- 处理时间: ${(endTime - startTime).toFixed(1)}ms`);
        
        // 创建下载链接以验证压缩后的图片
        const url = URL.createObjectURL(result.compressedFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compressed_${file.name}`;
        a.textContent = '下载压缩后的图片';
        document.body.appendChild(a);
        
        console.log('压缩成功！下载链接已添加到页面。');
        resolve(result);
        
      } catch (error) {
        console.error('压缩失败:', error);
        resolve(null);
      }
    };
    
    input.click();
  });
}

/**
 * 测试批量图片压缩
 * 在浏览器中测试，需要用户选择多个文件
 */
export async function testBatchImageCompression() {
  console.log('=== 测试批量图片压缩 ===');
  
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  
  return new Promise((resolve) => {
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      
      if (files.length === 0) {
        console.log('未选择文件');
        resolve(null);
        return;
      }
      
      console.log(`选择了 ${files.length} 个文件`);
      
      try {
        const startTime = performance.now();
        let processedCount = 0;
        
        const results = await compressImages(files, {
          maxWidth: 1600,
          maxHeight: 1200,
          maxSizeKB: 500,
          quality: 0.8
        }, (current, total) => {
          processedCount = current;
          console.log(`进度: ${current}/${total} (${(current/total*100).toFixed(1)}%)`);
        });
        
        const endTime = performance.now();
        
        // 统计总结果
        let totalOriginalSize = 0;
        let totalCompressedSize = 0;
        
        results.forEach((result, index) => {
          totalOriginalSize += result.originalSize;
          totalCompressedSize += result.compressedSize;
          console.log(`文件 ${index + 1}: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} (${(result.compressionRatio * 100).toFixed(1)}%)`);
        });
        
        console.log('批量压缩完成:');
        console.log(`- 总处理文件: ${files.length} 个`);
        console.log(`- 总原始大小: ${formatFileSize(totalOriginalSize)}`);
        console.log(`- 总压缩后大小: ${formatFileSize(totalCompressedSize)}`);
        console.log(`- 总压缩率: ${((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(1)}%`);
        console.log(`- 总处理时间: ${((endTime - startTime) / 1000).toFixed(1)}s`);
        console.log(`- 平均每张处理时间: ${((endTime - startTime) / files.length).toFixed(1)}ms`);
        
        resolve(results);
        
      } catch (error) {
        console.error('批量压缩失败:', error);
        resolve(null);
      }
    };
    
    input.click();
  });
}

/**
 * 测试压缩选项对结果的影响
 */
export async function testCompressionOptions() {
  console.log('=== 测试不同压缩选项 ===');
  
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  return new Promise((resolve) => {
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file) {
        console.log('未选择文件');
        resolve(null);
        return;
      }
      
      console.log(`测试文件: ${file.name} (${formatFileSize(file.size)})`);
      
      const testOptions = [
        { name: '高质量 (90%)', quality: 0.9, maxSizeKB: 1000 },
        { name: '标准质量 (80%)', quality: 0.8, maxSizeKB: 500 },
        { name: '高压缩 (60%)', quality: 0.6, maxSizeKB: 200 },
        { name: '极致压缩 (40%)', quality: 0.4, maxSizeKB: 100 }
      ];
      
      try {
        const results = [];
        
        for (const option of testOptions) {
          const startTime = performance.now();
          
          const result = await compressImage(file, {
            maxWidth: 1600,
            maxHeight: 1200,
            maxSizeKB: option.maxSizeKB,
            quality: option.quality
          });
          
          const endTime = performance.now();
          
          results.push({
            name: option.name,
            result,
            time: endTime - startTime
          });
          
          console.log(`${option.name}:`);
          console.log(`  压缩后大小: ${formatFileSize(result.compressedSize)}`);
          console.log(`  压缩率: ${(result.compressionRatio * 100).toFixed(1)}%`);
          console.log(`  处理时间: ${(endTime - startTime).toFixed(1)}ms`);
        }
        
        console.log('测试完成！');
        resolve(results);
        
      } catch (error) {
        console.error('测试失败:', error);
        resolve(null);
      }
    };
    
    input.click();
  });
}

// 在浏览器控制台中可以运行的测试函数
if (typeof window !== 'undefined') {
  (window as any).imageCompressionTest = {
    testSingleImageCompression,
    testBatchImageCompression,
    testCompressionOptions
  };
  
  console.log('图片压缩测试工具已加载！');
  console.log('可用的测试函数:');
  console.log('- imageCompressionTest.testSingleImageCompression() - 测试单张图片压缩');
  console.log('- imageCompressionTest.testBatchImageCompression() - 测试批量图片压缩');
  console.log('- imageCompressionTest.testCompressionOptions() - 测试不同压缩选项');
}
