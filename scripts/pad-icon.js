const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../assets/images/rent-control-icon-no-text.png');
const OUT = path.resolve(__dirname, '../assets/images/rent-control-icon-padded.png');
const PADDING = 60; // pixels on each side for iOS icon

const ANDROID_OUT = path.resolve(__dirname, '../assets/images/rent-control-icon-android-foreground.png');
const ANDROID_SIZE = 1024;
const SAFE_ZONE = 682; // 66.7% of 1024 — Android adaptive icon safe zone

async function buildIosPadded() {
  const meta = await sharp(SRC).metadata();
  const buf = await sharp(SRC)
    .extend({
      top: PADDING,
      bottom: PADDING,
      left: PADDING,
      right: PADDING,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();
  fs.writeFileSync(OUT, buf);
  console.log(`iOS icon:          ${meta.width + PADDING * 2}x${meta.height + PADDING * 2} → ${path.basename(OUT)}`);
}

async function buildAndroidForeground() {
  // Scale the orange icon to fit inside the Android safe zone
  const resized = await sharp(SRC)
    .resize(SAFE_ZONE, SAFE_ZONE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Extend to full 1024×1024 with transparent padding around the safe zone
  const pad = (ANDROID_SIZE - SAFE_ZONE) / 2;
  const buf = await sharp(resized)
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  fs.writeFileSync(ANDROID_OUT, buf);
  console.log(`Android foreground: ${ANDROID_SIZE}x${ANDROID_SIZE} (safe zone ${SAFE_ZONE}px) → ${path.basename(ANDROID_OUT)}`);
}

async function main() {
  const meta = await sharp(SRC).metadata();
  console.log(`Source: ${meta.width}x${meta.height}`);
  await buildIosPadded();
  await buildAndroidForeground();
  console.log('Done. Rebuild the app to see the changes.');
}

main().catch(console.error);
