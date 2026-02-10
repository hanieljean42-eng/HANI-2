const fs = require('fs');
const path = require('path');

// Créer des icônes SVG pour HANI 2 — Logo H❤️A attractif
const iconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="40%" style="stop-color:#E91E63"/>
      <stop offset="70%" style="stop-color:#C44569"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
    <linearGradient id="letterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#C44569"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
    <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF1744"/>
      <stop offset="100%" style="stop-color:#FF6B9D"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
    <filter id="glow">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="1024" height="1024" rx="220" fill="url(#bg)"/>
  <!-- Decorative circles -->
  <circle cx="200" cy="200" r="120" fill="white" opacity="0.05"/>
  <circle cx="824" cy="824" r="150" fill="white" opacity="0.05"/>
  <circle cx="800" cy="250" r="80" fill="white" opacity="0.03"/>
  <!-- Main white card -->
  <rect x="132" y="200" width="760" height="520" rx="60" fill="white" opacity="0.95" filter="url(#shadow)"/>
  <!-- Sparkles -->
  <text x="180" y="250" font-size="40" opacity="0.6">✨</text>
  <text x="800" y="300" font-size="35" opacity="0.5">💫</text>
  <text x="160" y="700" font-size="30" opacity="0.4">⭐</text>
  <text x="830" y="680" font-size="35" opacity="0.5">✨</text>
  <!-- Letter H -->
  <text x="230" y="570" font-family="Georgia, serif" font-size="320" font-weight="bold" fill="url(#letterGrad)" filter="url(#glow)">H</text>
  <!-- Heart between letters -->
  <path d="M512 370 C512 320, 570 270, 620 270 C690 270, 740 340, 740 390 C740 490, 512 620, 512 620 C512 620, 284 490, 284 390 C284 340, 334 270, 404 270 C454 270, 512 320, 512 370Z" fill="url(#heartGrad)" filter="url(#shadow)"/>
  <!-- Small white heart inside -->
  <path d="M512 400 C512 385, 530 370, 545 370 C565 370, 580 390, 580 400 C580 425, 512 460, 512 460 C512 460, 444 425, 444 400 C444 390, 459 370, 479 370 C494 370, 512 385, 512 400Z" fill="white" opacity="0.5"/>
  <!-- Letter A -->
  <text x="570" y="570" font-family="Georgia, serif" font-size="320" font-weight="bold" fill="url(#letterGrad)" filter="url(#glow)">A</text>
  <!-- App name at bottom -->
  <text x="512" y="810" font-family="Georgia, serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle" filter="url(#shadow)">HANI 2</text>
  <text x="512" y="860" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.7)" text-anchor="middle">Votre espace couple</text>
</svg>
`;

const adaptiveIconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="40%" style="stop-color:#E91E63"/>
      <stop offset="70%" style="stop-color:#C44569"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
    <linearGradient id="letterGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#C44569"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
    <linearGradient id="heartGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF1744"/>
      <stop offset="100%" style="stop-color:#FF6B9D"/>
    </linearGradient>
  </defs>
  <!-- Background with padding for adaptive icon safe zone -->
  <rect width="1024" height="1024" fill="url(#bg2)"/>
  <!-- Main white card - centered for safe zone -->
  <rect x="212" y="280" width="600" height="400" rx="50" fill="white" opacity="0.95"/>
  <!-- Letter H -->
  <text x="280" y="550" font-family="Georgia, serif" font-size="240" font-weight="bold" fill="url(#letterGrad2)">H</text>
  <!-- Heart -->
  <path d="M512 380 C512 345, 555 310, 590 310 C640 310, 675 360, 675 395 C675 470, 512 570, 512 570 C512 570, 349 470, 349 395 C349 360, 384 310, 434 310 C469 310, 512 345, 512 380Z" fill="url(#heartGrad2)"/>
  <!-- Letter A -->
  <text x="540" y="550" font-family="Georgia, serif" font-size="240" font-weight="bold" fill="url(#letterGrad2)">A</text>
</svg>
`;

const splashSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1284" height="2778" viewBox="0 0 1284 2778">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="30%" style="stop-color:#E91E63"/>
      <stop offset="60%" style="stop-color:#C44569"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
    <linearGradient id="letterGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#C44569"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
    <linearGradient id="heartGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF1744"/>
      <stop offset="100%" style="stop-color:#FF6B9D"/>
    </linearGradient>
    <filter id="shadow3">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="rgba(0,0,0,0.25)"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="1284" height="2778" fill="url(#bg3)"/>
  <!-- Decorative elements -->
  <circle cx="200" cy="400" r="200" fill="white" opacity="0.03"/>
  <circle cx="1084" cy="2400" r="250" fill="white" opacity="0.03"/>
  <circle cx="1000" cy="600" r="100" fill="white" opacity="0.02"/>
  <circle cx="300" cy="2200" r="150" fill="white" opacity="0.02"/>
  <!-- Main white card -->
  <rect x="342" y="1000" width="600" height="420" rx="50" fill="white" opacity="0.95" filter="url(#shadow3)"/>
  <!-- Letter H -->
  <text x="400" y="1280" font-family="Georgia, serif" font-size="240" font-weight="bold" fill="url(#letterGrad3)">H</text>
  <!-- Heart -->
  <path d="M642 1100 C642 1065, 685 1030, 720 1030 C770 1030, 805 1080, 805 1115 C805 1190, 642 1290, 642 1290 C642 1290, 479 1190, 479 1115 C479 1080, 514 1030, 564 1030 C599 1030, 642 1065, 642 1100Z" fill="url(#heartGrad3)" filter="url(#shadow3)"/>
  <!-- Letter A -->
  <text x="660" y="1280" font-family="Georgia, serif" font-size="240" font-weight="bold" fill="url(#letterGrad3)">A</text>
  <!-- App name -->
  <text x="642" y="1560" font-family="Georgia, serif" font-size="90" font-weight="bold" fill="white" text-anchor="middle" filter="url(#shadow3)">HANI 2</text>
  <text x="642" y="1650" font-family="Arial, sans-serif" font-size="36" fill="rgba(255,255,255,0.7)" text-anchor="middle">Votre espace couple privé</text>
  <!-- Small hearts decoration -->
  <text x="400" y="1800" font-size="40" opacity="0.3">💕</text>
  <text x="842" y="1780" font-size="35" opacity="0.25">💖</text>
  <text x="600" y="1850" font-size="30" opacity="0.2">✨</text>
</svg>
`;

const faviconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="50%" style="stop-color:#E91E63"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
    <linearGradient id="letterGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#C44569"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="12" fill="url(#bg4)"/>
  <rect x="6" y="10" width="36" height="25" rx="6" fill="white" opacity="0.95"/>
  <text x="9" y="30" font-family="Georgia, serif" font-size="16" font-weight="bold" fill="url(#letterGrad4)">H</text>
  <path d="M24 16 C24 14, 26.5 12, 28.5 12 C31.5 12, 33.5 15, 33.5 17 C33.5 21, 24 27, 24 27 C24 27, 14.5 21, 14.5 17 C14.5 15, 16.5 12, 19.5 12 C21.5 12, 24 14, 24 16Z" fill="#FF1744" transform="scale(0.55) translate(19.5, 13)"/>
  <text x="26" y="30" font-family="Georgia, serif" font-size="16" font-weight="bold" fill="url(#letterGrad4)">A</text>
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
