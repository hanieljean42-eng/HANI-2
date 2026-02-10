const fs = require('fs');
const path = require('path');

// Créer des icônes SVG pour HANI 2 — Logo H❤️A haute visibilité
const iconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E91E63"/>
      <stop offset="50%" style="stop-color:#C2185B"/>
      <stop offset="100%" style="stop-color:#880E4F"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="rgba(0,0,0,0.5)"/>
    </filter>
    <filter id="textShadow">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.4)"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" rx="220" fill="url(#bg)"/>
  <circle cx="180" cy="180" r="140" fill="white" opacity="0.06"/>
  <circle cx="850" cy="850" r="170" fill="white" opacity="0.04"/>
  <text x="170" y="610" font-family="Georgia, 'Times New Roman', serif" font-size="400" font-weight="bold" fill="white" filter="url(#textShadow)">H</text>
  <path d="M512 320 C512 288, 542 260, 567 260 C602 260, 627 292, 627 320 C627 375, 512 445, 512 445 C512 445, 397 375, 397 320 C397 292, 422 260, 457 260 C482 260, 512 288, 512 320Z" fill="#FF1744" filter="url(#shadow)"/>
  <path d="M512 340 C512 330, 523 322, 532 322 C545 322, 553 334, 553 340 C553 356, 512 378, 512 378 C512 378, 471 356, 471 340 C471 334, 479 322, 492 322 C501 322, 512 330, 512 340Z" fill="white" opacity="0.35"/>
  <text x="510" y="610" font-family="Georgia, 'Times New Roman', serif" font-size="400" font-weight="bold" fill="white" filter="url(#textShadow)">A</text>
  <text x="512" y="810" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle" filter="url(#textShadow)">HANI 2</text>
  <text x="512" y="875" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="rgba(255,255,255,0.8)" text-anchor="middle">Votre espace couple</text>
</svg>
`;

const adaptiveIconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E91E63"/>
      <stop offset="50%" style="stop-color:#C2185B"/>
      <stop offset="100%" style="stop-color:#880E4F"/>
    </linearGradient>
    <filter id="textShadow2">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.4)"/>
    </filter>
    <filter id="shadow2">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="rgba(0,0,0,0.4)"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg2)"/>
  <text x="220" y="590" font-family="Georgia, 'Times New Roman', serif" font-size="360" font-weight="bold" fill="white" filter="url(#textShadow2)">H</text>
  <path d="M512 340 C512 310, 540 285, 562 285 C594 285, 617 315, 617 340 C617 390, 512 455, 512 455 C512 455, 407 390, 407 340 C407 315, 430 285, 462 285 C484 285, 512 310, 512 340Z" fill="#FF1744" filter="url(#shadow2)"/>
  <text x="510" y="590" font-family="Georgia, 'Times New Roman', serif" font-size="360" font-weight="bold" fill="white" filter="url(#textShadow2)">A</text>
</svg>
`;

const splashSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1284" height="2778" viewBox="0 0 1284 2778">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E91E63"/>
      <stop offset="50%" style="stop-color:#C2185B"/>
      <stop offset="100%" style="stop-color:#880E4F"/>
    </linearGradient>
    <filter id="textShadow3">
      <feDropShadow dx="2" dy="5" stdDeviation="5" flood-color="rgba(0,0,0,0.45)"/>
    </filter>
    <filter id="shadow3">
      <feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="rgba(0,0,0,0.4)"/>
    </filter>
  </defs>
  <rect width="1284" height="2778" fill="url(#bg3)"/>
  <circle cx="200" cy="500" r="200" fill="white" opacity="0.04"/>
  <circle cx="1084" cy="2300" r="250" fill="white" opacity="0.03"/>
  <text x="330" y="1480" font-family="Georgia, 'Times New Roman', serif" font-size="400" font-weight="bold" fill="white" filter="url(#textShadow3)">H</text>
  <path d="M642 1150 C642 1115, 675 1085, 700 1085 C735 1085, 762 1118, 762 1150 C762 1210, 642 1290, 642 1290 C642 1290, 522 1210, 522 1150 C522 1118, 549 1085, 584 1085 C609 1085, 642 1115, 642 1150Z" fill="#FF1744" filter="url(#shadow3)"/>
  <path d="M642 1170 C642 1162, 651 1154, 658 1154 C668 1154, 675 1164, 675 1170 C675 1183, 642 1200, 642 1200 C642 1200, 609 1183, 609 1170 C609 1164, 616 1154, 626 1154 C633 1154, 642 1162, 642 1170Z" fill="white" opacity="0.35"/>
  <text x="650" y="1480" font-family="Georgia, 'Times New Roman', serif" font-size="400" font-weight="bold" fill="white" filter="url(#textShadow3)">A</text>
  <text x="642" y="1680" font-family="Georgia, 'Times New Roman', serif" font-size="100" font-weight="bold" fill="white" text-anchor="middle" filter="url(#textShadow3)">HANI 2</text>
  <text x="642" y="1770" font-family="Arial, Helvetica, sans-serif" font-size="40" fill="rgba(255,255,255,0.8)" text-anchor="middle">Votre espace couple privé</text>
</svg>
`;

const faviconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E91E63"/>
      <stop offset="50%" style="stop-color:#C2185B"/>
      <stop offset="100%" style="stop-color:#880E4F"/>
    </linearGradient>
    <filter id="ts4">
      <feDropShadow dx="0.5" dy="1" stdDeviation="0.8" flood-color="rgba(0,0,0,0.4)"/>
    </filter>
  </defs>
  <rect width="48" height="48" rx="12" fill="url(#bg4)"/>
  <text x="5" y="34" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="white" filter="url(#ts4)">H</text>
  <path d="M24 14 C24 12, 26 10.5, 27.5 10.5 C29.5 10.5, 31 12.5, 31 14 C31 17, 24 21, 24 21 C24 21, 17 17, 17 14 C17 12.5, 18.5 10.5, 20.5 10.5 C22 10.5, 24 12, 24 14Z" fill="#FF1744"/>
  <text x="23" y="34" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="white" filter="url(#ts4)">A</text>
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
