// 测试 CORS 修复
const testImageUrl = 'http://localhost:5050/uploads/segmented_1758074666214_seg_1758074655865_0dcfil.jpg';

// 创建一个测试图片元素
const testImg = new Image();
testImg.crossOrigin = 'anonymous'; // 使用匿名CORS

testImg.onload = function() {
  console.log('✅ 图片加载成功 (带 crossOrigin="anonymous")');
  console.log('图片尺寸:', this.width, 'x', this.height);
  document.body.removeChild(this);
};

testImg.onerror = function(e) {
  console.error('❌ 图片加载失败 (带 crossOrigin="anonymous"):', e);
  document.body.removeChild(this);
};

testImg.src = testImageUrl;
testImg.style.cssText = 'position:fixed;top:10px;left:10px;max-width:200px;border:2px solid green;z-index:9999;';
document.body.appendChild(testImg);

console.log('测试CORS修复，检查图片:', testImageUrl);
console.log('图片应该在页面左上角显示，如果成功的话');
