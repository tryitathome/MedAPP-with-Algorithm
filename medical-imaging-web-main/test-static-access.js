// 测试后端静态文件访问
console.log('=== 静态文件访问测试 ===\n');

const testFiles = [
  'segmented_1757667158925_seg_1757667151311_ldq04.jpg',
  'segmented_1757667082340_seg_1757667073285_m5dash.jpg',
  'segmented_1757667082474_seg_1757667073270_ff88gj.jpg'
];

console.log('将要测试的 URL：');
testFiles.forEach(file => {
  const correctUrl = `http://localhost:5050/uploads/${file}`;
  const wrongUrl = `http://localhost:5050/api/uploads/${file}`;
  
  console.log(`正确: ${correctUrl}`);
  console.log(`错误: ${wrongUrl}`);
  console.log('---');
});

console.log('\n请在浏览器中测试这些 URL：');
console.log('1. 正确的 URL 应该显示图片');
console.log('2. 错误的 URL 应该返回 404');

console.log('\n或者在命令行中测试：');
testFiles.forEach((file, index) => {
  const correctUrl = `http://localhost:5050/uploads/${file}`;
  console.log(`curl -I "${correctUrl}"`);
});

console.log('\n如果正确的 URL 返回 404，说明后端静态文件服务配置有问题');
console.log('如果正确的 URL 返回 200，但前端仍然请求错误的 URL，说明前端代码有问题');
