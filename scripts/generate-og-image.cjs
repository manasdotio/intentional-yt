const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGlow" cx="80%" cy="20%" r="65%">
      <stop offset="0%" stop-color="#1e3a8a" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#090d16" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cornerGlow" cx="15%" cy="85%" r="55%">
      <stop offset="0%" stop-color="#e11d48" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#090d16" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <linearGradient id="ytRed" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff334b"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
  </defs>

  <!-- Base Dark Canvas -->
  <rect width="1200" height="630" fill="#090d16"/>
  <rect width="1200" height="630" fill="url(#bgGlow)"/>
  <rect width="1200" height="630" fill="url(#cornerGlow)"/>

  <!-- Subtle Inner Card Panel -->
  <rect x="36" y="36" width="1128" height="558" rx="24" fill="#0f172a" fill-opacity="0.5" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5"/>

  <!-- Top Header Row -->
  <g transform="translate(80, 84)">
    <!-- Intentional YT Shield & Reticle Logo -->
    <circle cx="26" cy="26" r="22" fill="none" stroke="#2563eb" stroke-width="3"/>
    <path d="M 26 4 A 22 22 0 0 1 48 26" fill="none" stroke="#60a5fa" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M 21 16 C 21 14.8 22.2 14.2 23.2 14.8 L 35 25.2 C 35.8 25.8 35.8 26.8 35 27.4 L 23.2 37.8 C 22.2 38.4 21 37.8 21 36.6 Z" fill="url(#ytRed)"/>
    <path d="M 23 19 C 23 18.5 23.6 18.2 24 18.5 L 32 25.5 C 32.5 25.9 32.5 26.5 32 26.9 L 24 33.9 C 23.6 34.2 23 33.9 23 33.4 Z" fill="#ffffff"/>

    <text x="66" y="35" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="700" fill="#f8fafc" letter-spacing="-0.5">
      Intentional YT
    </text>

    <!-- Eyebrow Badge -->
    <rect x="250" y="10" width="195" height="34" rx="17" fill="rgba(37, 99, 235, 0.2)" stroke="rgba(96, 165, 250, 0.35)" stroke-width="1"/>
    <text x="347" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12.5" font-weight="700" fill="#93c5fd" text-anchor="middle" letter-spacing="1.5">
      HONEST COMPARISON
    </text>
  </g>

  <!-- Main Headline Block -->
  <g transform="translate(80, 215)">
    <text x="0" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="800" fill="url(#titleGrad)" letter-spacing="-1.5">
      Intentional YT vs Unhook vs Untrap
    </text>
    <text x="0" y="132" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="500" fill="#94a3b8" letter-spacing="-0.5">
      An Honest Comparison of YouTube Distraction Blockers
    </text>
  </g>

  <!-- Feature Highlights Row -->
  <g transform="translate(80, 465)">
    <!-- Pill 1 -->
    <rect x="0" y="0" width="220" height="46" rx="14" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1"/>
    <text x="110" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14.5" font-weight="600" fill="#e2e8f0" text-anchor="middle">
      100% Free &amp; Open Source
    </text>

    <!-- Pill 2 -->
    <rect x="236" y="0" width="200" height="46" rx="14" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1"/>
    <text x="336" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14.5" font-weight="600" fill="#e2e8f0" text-anchor="middle">
      Zero Telemetry / Private
    </text>

    <!-- Pill 3 -->
    <rect x="452" y="0" width="225" height="46" rx="14" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1"/>
    <text x="564" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14.5" font-weight="600" fill="#e2e8f0" text-anchor="middle">
      Focus Lock &amp; Daily Limits
    </text>

    <!-- Site URL on Right -->
    <text x="1040" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="600" fill="#60a5fa" text-anchor="end">
      intentionalyt.me/blog
    </text>
  </g>
</svg>
`;

async function run() {
  const outputDir = path.join(__dirname, '..', 'public', 'screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'og-intentional-yt-vs-unhook-vs-untrap.png');
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log('Successfully generated OG image at:', outputPath);

  // Also copy to root screenshots/ for repo consistency
  const rootScreenshots = path.join(__dirname, '..', 'screenshots');
  if (fs.existsSync(rootScreenshots)) {
    fs.copyFileSync(outputPath, path.join(rootScreenshots, 'og-intentional-yt-vs-unhook-vs-untrap.png'));
    console.log('Copied to screenshots/og-intentional-yt-vs-unhook-vs-untrap.png');
  }
}

run().catch(console.error);
