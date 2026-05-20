const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SIZE = 1024;

// 节点配置：[cx, cy, radius, color]
const CENTER = [512, 512, 150, '#6c63ff'];
const NODES = [
  [295, 265, 68, '#6c63ff'],  // 左上 同义
  [745, 295, 60, '#f7971e'],  // 右上 上位
  [760, 690, 65, '#43e97b'],  // 右下 反义
  [265, 710, 60, '#fa709a'],  // 左下 派生
  [512, 185, 55, '#4fc3f7'],  // 正上 近义
  [185, 512, 52, '#a78bfa'],  // 正左 整体
];

function edge(x1, y1, x2, y2, color) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
    stroke="${color}" stroke-width="9" stroke-opacity="0.35"
    stroke-linecap="round"/>`;
}

function circle(cx, cy, r, fill, opacity = 1) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"/>`;
}

const edges = NODES.map(([cx, cy, , color]) =>
  edge(CENTER[0], CENTER[1], cx, cy, color)
).join('\n  ');

const satelliteGlow = NODES.map(([cx, cy, r, color]) =>
  `<circle cx="${cx}" cy="${cy}" r="${r + 18}" fill="${color}" opacity="0.18"/>`
).join('\n  ');

const satellites = NODES.map(([cx, cy, r, color]) =>
  circle(cx, cy, r, color, 0.82)
).join('\n  ');

const svg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${SIZE}" y2="${SIZE}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#0a0a14"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="22" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softglow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- 背景 -->
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)" rx="200"/>

  <!-- 背景光晕 -->
  <circle cx="512" cy="512" r="320" fill="#6c63ff" opacity="0.07"/>

  <!-- 连接线 -->
  ${edges}

  <!-- 卫星节点光晕 -->
  ${satelliteGlow}

  <!-- 卫星节点 -->
  ${satellites}

  <!-- 中心节点光晕 -->
  <circle cx="512" cy="512" r="195" fill="#6c63ff" opacity="0.25" filter="url(#glow)"/>

  <!-- 中心节点 -->
  <circle cx="512" cy="512" r="152" fill="#6c63ff" filter="url(#softglow)"/>
  <circle cx="512" cy="512" r="148" fill="#6c63ff"/>

  <!-- 中心字母 W -->
  <text x="512" y="560"
    font-family="Arial Black, Arial, sans-serif"
    font-size="158" font-weight="900"
    fill="white" text-anchor="middle"
    opacity="0.95">W</text>
</svg>`;

async function main() {
  const outDir = path.join(__dirname, '../assets');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const iconPath = path.join(outDir, 'icon.png');
  const splashIconPath = path.join(outDir, 'adaptive-icon.png');

  await sharp(Buffer.from(svg)).png().toFile(iconPath);
  console.log('✅ assets/icon.png (1024×1024)');

  // adaptive-icon 留白边距给 Android 遮罩
  await sharp(Buffer.from(svg))
    .resize(820, 820)
    .extend({ top: 102, bottom: 102, left: 102, right: 102, background: { r: 14, g: 14, b: 26, alpha: 1 } })
    .png()
    .toFile(splashIconPath);
  console.log('✅ assets/adaptive-icon.png (1024×1024, with padding)');
}

main().catch(e => { console.error(e); process.exit(1); });
