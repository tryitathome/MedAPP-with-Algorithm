// 测试分割服务的新文件保存逻辑
const fs = require('fs');
const path = require('path');

console.log('=== 分割服务文件保存路径测试 ===');

// 模拟分割服务的路径配置
const mmdetectionDir = 'D:\\MyWorkSpace\\MedAPP\\MMDETECTION_mini';
const defaultOutputDir = 'eval_results';
const uploadsDir = path.join(__dirname, 'apps', 'backend', 'uploads');

console.log('\n路径配置检查：');
console.log(`MMDETECTION 目录: ${mmdetectionDir}`);
console.log(`临时输出目录: ${path.join(mmdetectionDir, defaultOutputDir, 'vis')}`);
console.log(`最终保存目录: ${uploadsDir}`);

// 检查目录是否存在
const checks = [
  { name: 'MMDETECTION目录', path: mmdetectionDir },
  { name: '临时输出目录', path: path.join(mmdetectionDir, defaultOutputDir) },
  { name: 'uploads目录', path: uploadsDir }
];

console.log('\n目录存在性检查：');
checks.forEach(check => {
  const exists = fs.existsSync(check.path);
  console.log(`${check.name}: ${exists ? '✓' : '✗'} ${check.path}`);
  
  if (!exists && check.name === 'uploads目录') {
    console.log('  → 将自动创建 uploads 目录');
  }
});

// 模拟文件名生成逻辑
const testImageName = 'seg_1757665805157_qox0b.jpg';
const timestamp = Date.now();
const ext = path.extname(testImageName);
const baseName = path.basename(testImageName, ext);
const finalFileName = `segmented_${timestamp}_${baseName}${ext}`;

console.log('\n文件名生成测试：');
console.log(`原始文件名: ${testImageName}`);
console.log(`最终文件名: ${finalFileName}`);
console.log(`最终路径: ${path.join(uploadsDir, finalFileName)}`);
console.log(`访问URL: /uploads/${finalFileName}`);

// 检查现有分割结果文件
console.log('\n现有分割文件检查：');
const tempResultsDir = path.join(mmdetectionDir, defaultOutputDir, 'vis');
if (fs.existsSync(tempResultsDir)) {
  const tempFiles = fs.readdirSync(tempResultsDir);
  console.log(`临时目录文件数量: ${tempFiles.length}`);
  tempFiles.slice(0, 3).forEach(file => {
    console.log(`  - ${file}`);
  });
  if (tempFiles.length > 3) {
    console.log(`  - ... 还有 ${tempFiles.length - 3} 个文件`);
  }
} else {
  console.log('临时输出目录不存在');
}

if (fs.existsSync(uploadsDir)) {
  const uploadFiles = fs.readdirSync(uploadsDir);
  const segmentedFiles = uploadFiles.filter(f => f.startsWith('segmented_'));
  console.log(`uploads目录中的分割文件数量: ${segmentedFiles.length}`);
  segmentedFiles.slice(0, 3).forEach(file => {
    console.log(`  - ${file}`);
  });
} else {
  console.log('uploads目录不存在');
}

console.log('\n修改总结：');
console.log('1. 算法仍然输出到 MMDETECTION_mini/eval_results/vis/');
console.log('2. 后端自动将结果复制到 uploads/ 目录');
console.log('3. 前端通过 /uploads/segmented_xxx.jpg 访问');
console.log('4. 清理功能会清理两个位置的旧文件');
console.log('5. 使用时间戳前缀避免文件名冲突');

console.log('\n测试建议：');
console.log('1. 重启后端服务应用新的分割逻辑');
console.log('2. 进行完整的分割测试流程');
console.log('3. 检查 uploads 目录是否生成分割结果');
console.log('4. 验证前端能否正确显示分割图片');
