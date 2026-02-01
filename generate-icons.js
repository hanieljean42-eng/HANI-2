const fs = require('fs');
const path = require('path');

// Créer des icônes SVG pour Couple H
const iconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="50%" style="stop-color:#C44569"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <!-- White circle -->
  <circle cx="512" cy="512" r="350" fill="white" opacity="0.95"/>
  <!-- Letter C -->
  <text x="280" y="580" font-family="Arial, sans-serif" font-size="280" font-weight="bold" fill="#C44569">C</text>
  <!-- Heart emoji (simplified as heart shape) -->
  <path d="M512 420 C512 380, 560 340, 600 340 C660 340, 700 400, 700 440 C700 520, 512 650, 512 650 C512 650, 324 520, 324 440 C324 400, 364 340, 424 340 C464 340, 512 380, 512 420Z" fill="#FF6B9D"/>
  <!-- Letter H -->
  <text x="600" y="580" font-family="Arial, sans-serif" font-size="280" font-weight="bold" fill="#C44569">H</text>
</svg>
`;

const adaptiveIconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="50%" style="stop-color:#C44569"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
  </defs>
  <!-- Background with padding for adaptive icon safe zone -->
  <rect width="1024" height="1024" fill="url(#bg2)"/>
  <!-- White circle - centered and smaller for safe zone -->
  <circle cx="512" cy="512" r="280" fill="white" opacity="0.95"/>
  <!-- Letter C -->
  <text x="320" y="570" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="#C44569">C</text>
  <!-- Heart -->
  <path d="M512 440 C512 410, 545 380, 575 380 C620 380, 650 420, 650 450 C650 510, 512 600, 512 600 C512 600, 374 510, 374 450 C374 420, 404 380, 449 380 C479 380, 512 410, 512 440Z" fill="#FF6B9D"/>
  <!-- Letter H -->
  <text x="560" y="570" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="#C44569">H</text>
</svg>
`;

const splashSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1284" height="2778" viewBox="0 0 1284 2778">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="50%" style="stop-color:#C44569"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="1284" height="2778" fill="url(#bg3)"/>
  <!-- White circle -->
  <circle cx="642" cy="1200" r="250" fill="white" opacity="0.95"/>
  <!-- Letter C -->
  <text x="480" y="1260" font-family="Arial, sans-serif" font-size="180" font-weight="bold" fill="#C44569">C</text>
  <!-- Heart -->
  <path d="M642 1130 C642 1105, 670 1080, 695 1080 C732 1080, 758 1110, 758 1135 C758 1185, 642 1260, 642 1260 C642 1260, 526 1185, 526 1135 C526 1110, 552 1080, 589 1080 C614 1080, 642 1105, 642 1130Z" fill="#FF6B9D"/>
  <!-- Letter H -->
  <text x="670" y="1260" font-family="Arial, sans-serif" font-size="180" font-weight="bold" fill="#C44569">H</text>
  <!-- App name -->
  <text x="642" y="1550" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">Couple H</text>
  <text x="642" y="1630" font-family="Arial, sans-serif" font-size="36" fill="rgba(255,255,255,0.8)" text-anchor="middle">Votre espace couple privé</text>
</svg>
`;

const faviconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="100%" style="stop-color:#C44569"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="10" fill="url(#bg4)"/>
  <circle cx="24" cy="24" r="16" fill="white" opacity="0.95"/>
  <text x="12" y="30" font-family="Arial" font-size="14" font-weight="bold" fill="#C44569">C</text>
  <text x="26" y="30" font-family="Arial" font-size="14" font-weight="bold" fill="#C44569">H</text>
  <path d="M24 20 C24 18, 26 16, 28 16 C31 16, 33 19, 33 21 C33 25, 24 30, 24 30 C24 30, 15 25, 15 21 C15 19, 17 16, 20 16 C22 16, 24 18, 24 20Z" fill="#FF6B9D" transform="scale(0.5) translate(24, 24)"/>
</svg>
`;

// Sauvegarder les SVG
fs.writeFileSync(path.join('./assets', 'icon.svg'), iconSVG.trim());
fs.writeFileSync(path.join('./assets', 'adaptive-icon.svg'), adaptiveIconSVG.trim());
fs.writeFileSync(path.join('./assets', 'splash.svg'), splashSVG.trim());
fs.writeFileSync(path.join('./assets', 'favicon.svg'), faviconSVG.trim());

console.log('✅ Fichiers SVG créés dans ./assets/');
console.log('');
console.log('Pour convertir en PNG, utilisez un outil en ligne comme:');
console.log('https://svgtopng.com/ ou https://cloudconvert.com/svg-to-png');
console.log('');
console.log('Tailles requises:');
console.log('- icon.png: 1024x1024');
console.log('- adaptive-icon.png: 1024x1024');
console.log('- splash.png: 1284x2778');
console.log('- favicon.png: 48x48');
