// test/segmentation.test.js - 分割服务测试脚本
const path = require('path');
const fs = require('fs');

// 测试图片路径
const testImagePath = 'D:\\MyWorkSpace\\MedAPP\\MMDETECTION_mini\\ExamplePicture\\oral-1567.JPG';

// 检查测试环境
function checkTestEnvironment() {
  console.log('=== 分割环境检查 ===');
  
  const pythonPath = 'C:\\Users\\tryitathome\\.conda\\envs\\MMDETECTION\\python.exe';
  const scriptPath = 'D:\\MyWorkSpace\\MedAPP\\MMDETECTION_mini\\image_demo.py';
  const configPath = 'D:\\MyWorkSpace\\MedAPP\\MMDETECTION_mini\\eval_ZJY_1102_mask2\\mask2former_swin_s.py';
  const weightsPath = 'D:\\MyWorkSpace\\MedAPP\\MMDETECTION_mini\\eval_ZJY_1102_mask2\\Swing-S-75000-best-data.pth';
  
  const checks = [
    { name: 'Python环境', path: pythonPath },
    { name: '测试图片', path: testImagePath },
    { name: '推理脚本', path: scriptPath },
    { name: '配置文件', path: configPath },
    { name: '模型权重', path: weightsPath }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    const exists = fs.existsSync(check.path);
    console.log(`${check.name}: ${exists ? '✓' : '✗'} ${check.path}`);
    if (!exists) allPassed = false;
  });
  
  return allPassed;
}

// 生成测试命令
function generateTestCommand() {
  const pythonPath = 'C:\\Users\\tryitathome\\.conda\\envs\\MMDETECTION\\python.exe';
  const scriptPath = 'D:\\MyWorkSpace\\MedAPP\\MMDETECTION_mini\\image_demo.py';
  const configPath = 'D:\\MyWorkSpace\\MedAPP\\MMDETECTION_mini\\eval_ZJY_1102_mask2\\mask2former_swin_s.py';
  const weightsPath = 'D:\\MyWorkSpace\\MedAPP\\MMDETECTION_mini\\eval_ZJY_1102_mask2\\Swing-S-75000-best-data.pth';
  
  return [
    `"${pythonPath}"`,
    `"${scriptPath}"`,
    `"${testImagePath}"`,
    `"${configPath}"`,
    '--weights',
    `"${weightsPath}"`,
    '--out-dir',
    'eval_results'
  ].join(' ');
}

// 主测试函数
function runTest() {
  console.log('=== MMDETECTION 分割算法接入测试 ===\n');
  
  // 环境检查
  const envReady = checkTestEnvironment();
  console.log(`\n环境检查: ${envReady ? '通过' : '失败'}\n`);
  
  if (!envReady) {
    console.log('请确保所有必需文件都存在后再运行测试。');
    return;
  }
  
  // 生成测试命令
  const command = generateTestCommand();
  console.log('=== 手动测试命令 ===');
  console.log('请在 MMDETECTION_mini 目录下运行以下命令:');
  console.log(`cd D:\\MyWorkSpace\\MedAPP\\MMDETECTION_mini`);
  console.log(command);
  console.log('\n预期结果:');
  console.log('- 成功处理图片');
  console.log('- 在 eval_results/vis/ 目录下生成 oral-1567.JPG');
  console.log('- 可通过 /api/segmentation/result/eval_results/vis/oral-1567.JPG 访问');
  
  console.log('\n=== 后端 API 测试 ===');
  console.log('1. 启动后端服务');
  console.log('2. 发送 POST 请求到 /api/segmentation');
  console.log('3. 请求体示例:');
  console.log(JSON.stringify({
    image: 'data:image/jpeg;base64,<base64_image_data>',
    options: {}
  }, null, 2));
  
  console.log('\n=== 前端集成测试 ===');
  console.log('1. 启动前端服务');
  console.log('2. 进入口腔黏膜诊断流程');
  console.log('3. 完成三分类检测');
  console.log('4. 点击"病灶区域分割"按钮');
  console.log('5. 验证分割结果显示');
}

// 运行测试
runTest();
