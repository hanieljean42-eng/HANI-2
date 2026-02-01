const fs = require('fs');
const path = require('path');

const dir = './assets';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

// Create a simple PNG file (1x1 pink pixel expanded)
function createSimplePNG(width, height, filename) {
  // PNG header and IHDR chunk for a solid color image
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // For simplicity, create a minimal valid PNG with pink color
  // This is a base64 encoded 100x100 pink PNG that we'll use as placeholder
  const pinkBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  
  // Decode and write
  const buffer = Buffer.from(pinkBase64, 'base64');
  fs.writeFileSync(path.join(dir, filename), buffer);
  console.log(`Created ${filename}`);
}

// Create all required assets
createSimplePNG(1024, 1024, 'icon.png');
createSimplePNG(1284, 2778, 'splash.png');
createSimplePNG(1024, 1024, 'adaptive-icon.png');
createSimplePNG(48, 48, 'favicon.png');

console.log('All assets created!');
