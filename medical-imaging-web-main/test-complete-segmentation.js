// 完整的分割功能测试脚本
const fs = require('fs');
const path = require('path');

console.log('=== 实例分割功能完整测试 ===\n');

// 1. 环境检查
console.log('1. 环境配置检查：');
const pythonPath = 'C:\\Users\\tryitathome\\.conda\\envs\\MMDETECTION\\python.exe';
const mmdetectionDir = 'D:\\MyWorkSpace\\MedAPP\\MMDETECTION_mini';
const scriptPath = path.join(mmdetectionDir, 'image_demo.py');
const configPath = path.join(mmdetectionDir, 'eval_ZJY_1102_mask2', 'mask2former_swin_s.py');
const weightsPath = path.join(mmdetectionDir, 'eval_ZJY_1102_mask2', 'Swing-S-75000-best-data.pth');
const uploadsDir = path.join(__dirname, 'apps', 'backend', 'uploads');

const envChecks = [
  { name: 'Python环境', path: pythonPath },
  { name: '推理脚本', path: scriptPath },
  { name: '配置文件', path: configPath },
  { name: '模型权重', path: weightsPath },
  { name: 'Uploads目录', path: uploadsDir }
];

let envReady = true;
envChecks.forEach(check => {
  const exists = fs.existsSync(check.path);
  console.log(`  ${check.name}: ${exists ? '✓' : '✗'} ${check.path}`);
  if (!exists) envReady = false;
});

console.log(`\n环境状态: ${envReady ? '✓ 就绪' : '✗ 不完整'}\n`);

// 2. 当前文件状态检查
console.log('2. 当前文件状态：');
const tempResultsDir = path.join(mmdetectionDir, 'eval_results', 'vis');
if (fs.existsSync(tempResultsDir)) {
  const tempFiles = fs.readdirSync(tempResultsDir);
  console.log(`  临时输出目录文件数: ${tempFiles.length}`);
  const segFiles = tempFiles.filter(f => f.startsWith('seg_'));
  if (segFiles.length > 0) {
    console.log(`  最新seg文件: ${segFiles[segFiles.length - 1]}`);
  }
} else {
  console.log('  临时输出目录不存在');
}

if (fs.existsSync(uploadsDir)) {
  const uploadFiles = fs.readdirSync(uploadsDir);
  const segmentedFiles = uploadFiles.filter(f => f.startsWith('segmented_'));
  const inputFiles = uploadFiles.filter(f => f.startsWith('seg_') && !f.startsWith('segmented_'));
  
  console.log(`  Uploads目录总文件数: ${uploadFiles.length}`);
  console.log(`  输入图片文件(seg_): ${inputFiles.length}`);
  console.log(`  分割结果文件(segmented_): ${segmentedFiles.length}`);
  
  if (segmentedFiles.length > 0) {
    console.log(`  最新分割结果: ${segmentedFiles[segmentedFiles.length - 1]}`);
  }
} else {
  console.log('  Uploads目录不存在');
}

// 3. 文件处理逻辑模拟
console.log('\n3. 文件处理逻辑模拟：');
const testInputFile = 'seg_1757665805157_qox0b.jpg';
const timestamp = Date.now();
const ext = path.extname(testInputFile);
const baseName = path.basename(testInputFile, ext);
const expectedOutputFile = `segmented_${timestamp}_${baseName}${ext}`;

console.log(`  输入文件: ${testInputFile}`);
console.log(`  预期输出: ${expectedOutputFile}`);
console.log(`  访问URL: /uploads/${expectedOutputFile}`);

// 4. 修复前后对比
console.log('\n4. 修复前后对比：');
console.log('  修复前:');
console.log('    - blob URL → 400 "无效的图片格式"');
console.log('    - 分割结果保存在 MMDETECTION_mini/eval_results/vis/');
console.log('    - 前端无法访问分割结果图片');
console.log('');
console.log('  修复后:');
console.log('    - blob URL → 自动转换为 base64 → 成功处理');
console.log('    - 分割结果复制到 uploads/ 目录');
console.log('    - 前端通过 /uploads/ 路径正常访问');

// 5. 测试建议
console.log('\n5. 测试建议：');
console.log('  步骤1: 重启后端服务（应用新的分割逻辑）');
console.log('  步骤2: 进入口腔黏膜诊断页面');
console.log('  步骤3: 完成完整诊断流程（二分类 → 三分类）');
console.log('  步骤4: 点击"病灶区域分割"按钮');
console.log('  步骤5: 验证以下内容：');
console.log('    - 前端控制台显示 base64 转换日志');
console.log('    - 网络请求 200 状态码');
console.log('    - uploads 目录生成新的 segmented_ 文件');
console.log('    - 分割页面正确显示分割结果');

// 6. 问题排查
console.log('\n6. 如果仍有问题，检查：');
console.log('  - 前端控制台错误信息');
console.log('  - 后端终端日志输出');
console.log('  - uploads 目录权限');
console.log('  - 静态文件服务配置');

console.log('\n测试完成！');

// 7. 生成测试命令
if (envReady) {
  console.log('\n7. 手动测试命令（可选）：');
  const testImagePath = path.join(mmdetectionDir, 'ExamplePicture', 'oral-1567.JPG');
  if (fs.existsSync(testImagePath)) {
    const command = [
      `"${pythonPath}"`,
      `"${scriptPath}"`,
      `"${testImagePath}"`,
      `"${configPath}"`,
      '--weights',
      `"${weightsPath}"`,
      '--out-dir',
      'eval_results'
    ].join(' ');
    
    console.log(`cd "${mmdetectionDir}"`);
    console.log(command);
    console.log('\n然后检查 eval_results/vis/ 目录是否生成了 oral-1567.JPG');
  }
}
