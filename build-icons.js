const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = './assets';

// SVG pour l'icône principale (1024x1024) — H❤️A
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
  </defs>
  <rect width="1024" height="1024" rx="220" fill="url(#bg)"/>
  <circle cx="200" cy="200" r="120" fill="white" opacity="0.05"/>
  <circle cx="824" cy="824" r="150" fill="white" opacity="0.05"/>
  <rect x="132" y="200" width="760" height="520" rx="60" fill="white" opacity="0.95"/>
  <text x="230" y="570" font-family="Georgia, serif" font-size="320" font-weight="bold" fill="url(#letterGrad)">H</text>
  <path d="M512 370 C512 320, 570 270, 620 270 C690 270, 740 340, 740 390 C740 490, 512 620, 512 620 C512 620, 284 490, 284 390 C284 340, 334 270, 404 270 C454 270, 512 320, 512 370Z" fill="url(#heartGrad)"/>
  <path d="M512 400 C512 385, 530 370, 545 370 C565 370, 580 390, 580 400 C580 425, 512 460, 512 460 C512 460, 444 425, 444 400 C444 390, 459 370, 479 370 C494 370, 512 385, 512 400Z" fill="white" opacity="0.4"/>
  <text x="570" y="570" font-family="Georgia, serif" font-size="320" font-weight="bold" fill="url(#letterGrad)">A</text>
  <text x="512" y="810" font-family="Georgia, serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">HANI 2</text>
  <text x="512" y="860" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.7)" text-anchor="middle">Votre espace couple</text>
</svg>`;

// SVG pour l'icône adaptive Android
const adaptiveSVG = `
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
  <rect width="1024" height="1024" fill="url(#bg2)"/>
  <rect x="212" y="280" width="600" height="400" rx="50" fill="white" opacity="0.95"/>
  <text x="280" y="550" font-family="Georgia, serif" font-size="240" font-weight="bold" fill="url(#letterGrad2)">H</text>
  <path d="M512 380 C512 345, 555 310, 590 310 C640 310, 675 360, 675 395 C675 470, 512 570, 512 570 C512 570, 349 470, 349 395 C349 360, 384 310, 434 310 C469 310, 512 345, 512 380Z" fill="url(#heartGrad2)"/>
  <text x="540" y="550" font-family="Georgia, serif" font-size="240" font-weight="bold" fill="url(#letterGrad2)">A</text>
</svg>`;

// Splash screen
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
  </defs>
  <rect width="1284" height="2778" fill="url(#bg3)"/>
  <circle cx="200" cy="400" r="200" fill="white" opacity="0.03"/>
  <circle cx="1084" cy="2400" r="250" fill="white" opacity="0.03"/>
  <rect x="342" y="1000" width="600" height="420" rx="50" fill="white" opacity="0.95"/>
  <text x="400" y="1280" font-family="Georgia, serif" font-size="240" font-weight="bold" fill="url(#letterGrad3)">H</text>
  <path d="M642 1100 C642 1065, 685 1030, 720 1030 C770 1030, 805 1080, 805 1115 C805 1190, 642 1290, 642 1290 C642 1290, 479 1190, 479 1115 C479 1080, 514 1030, 564 1030 C599 1030, 642 1065, 642 1100Z" fill="url(#heartGrad3)"/>
  <text x="660" y="1280" font-family="Georgia, serif" font-size="240" font-weight="bold" fill="url(#letterGrad3)">A</text>
  <text x="642" y="1560" font-family="Georgia, serif" font-size="90" font-weight="bold" fill="white" text-anchor="middle">HANI 2</text>
  <text x="642" y="1650" font-family="Arial, sans-serif" font-size="36" fill="rgba(255,255,255,0.7)" text-anchor="middle">Votre espace couple privé</text>
</svg>`;

// Favicon
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
</svg>`;

async function generateIcons() {
  try {
    console.log('🎨 Génération des icônes HANI 2 (H❤️A)...\n');

    // Icon principal
    await sharp(Buffer.from(iconSVG))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('✅ icon.png (1024x1024)');

    // Adaptive icon
    await sharp(Buffer.from(adaptiveSVG))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('✅ adaptive-icon.png (1024x1024)');

    // Splash screen
    await sharp(Buffer.from(splashSVG))
      .resize(1284, 2778)
      .png()
      .toFile(path.join(assetsDir, 'splash.png'));
    console.log('✅ splash.png (1284x2778)');

    // Favicon
    await sharp(Buffer.from(faviconSVG))
      .resize(48, 48)
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('✅ favicon.png (48x48)');

    console.log('\n🎉 Toutes les icônes ont été générées avec succès!');
    console.log('📱 Reconstruisez l\'APK pour voir les nouveaux logos.');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

generateIcons();
