const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = './assets';

// SVG pour l'icône principale (1024x1024)
const iconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="50%" style="stop-color:#C44569"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="200" fill="url(#bg)"/>
  <circle cx="512" cy="480" r="300" fill="white"/>
  <text x="300" y="560" font-family="Arial Black, Arial, sans-serif" font-size="240" font-weight="900" fill="#C44569">C</text>
  <text x="540" y="560" font-family="Arial Black, Arial, sans-serif" font-size="240" font-weight="900" fill="#C44569">H</text>
  <path d="M512 700 Q512 650 560 650 Q620 650 620 710 Q620 780 512 860 Q404 780 404 710 Q404 650 464 650 Q512 650 512 700Z" fill="#FF6B9D"/>
</svg>`;

// SVG pour l'icône adaptive Android (foreground)
const adaptiveSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="50%" style="stop-color:#C44569"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg2)"/>
  <circle cx="512" cy="460" r="260" fill="white"/>
  <text x="330" y="530" font-family="Arial Black, Arial, sans-serif" font-size="200" font-weight="900" fill="#C44569">C</text>
  <text x="530" y="530" font-family="Arial Black, Arial, sans-serif" font-size="200" font-weight="900" fill="#C44569">H</text>
  <path d="M512 660 Q512 620 555 620 Q605 620 605 670 Q605 730 512 800 Q419 730 419 670 Q419 620 469 620 Q512 620 512 660Z" fill="#FF6B9D"/>
</svg>`;

// SVG pour le splash screen
const splashSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1284" height="2778" viewBox="0 0 1284 2778">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="50%" style="stop-color:#C44569"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
  </defs>
  <rect width="1284" height="2778" fill="url(#bg3)"/>
  <circle cx="642" cy="1150" r="200" fill="white"/>
  <text x="490" y="1205" font-family="Arial Black, Arial, sans-serif" font-size="150" font-weight="900" fill="#C44569">C</text>
  <text x="645" y="1205" font-family="Arial Black, Arial, sans-serif" font-size="150" font-weight="900" fill="#C44569">H</text>
  <path d="M642 1280 Q642 1250 675 1250 Q715 1250 715 1290 Q715 1340 642 1400 Q569 1340 569 1290 Q569 1250 609 1250 Q642 1250 642 1280Z" fill="#FF6B9D"/>
  <text x="642" y="1520" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle">Couple H</text>
  <text x="642" y="1590" font-family="Arial, sans-serif" font-size="32" fill="rgba(255,255,255,0.85)" text-anchor="middle">Votre espace couple privé 💕</text>
</svg>`;

// Favicon
const faviconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="100%" style="stop-color:#C44569"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="10" fill="url(#bg4)"/>
  <circle cx="24" cy="22" r="14" fill="white"/>
  <text x="11" y="28" font-family="Arial" font-size="14" font-weight="bold" fill="#C44569">C</text>
  <text x="25" y="28" font-family="Arial" font-size="14" font-weight="bold" fill="#C44569">H</text>
  <path d="M24 34 Q24 31 27 31 Q31 31 31 35 Q31 39 24 43 Q17 39 17 35 Q17 31 21 31 Q24 31 24 34Z" fill="#FF6B9D" transform="scale(0.6) translate(16, -8)"/>
</svg>`;

async function generateIcons() {
  try {
    console.log('🎨 Génération des icônes Couple H...\n');

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
