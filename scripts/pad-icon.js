const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../assets/images/rent-control-icon-no-text.png');
const OUT = path.resolve(__dirname, '../assets/images/rent-control-icon-padded.png');
const PADDING = 60; // pixels on each side — increase if still cut

async function main() {
  const meta = await sharp(SRC).metadata();
  console.log(`Original: ${meta.width}x${meta.height}`);

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
  console.log(`Padded:   ${meta.width + PADDING * 2}x${meta.height + PADDING * 2} → ${path.basename(OUT)}`);
  console.log('Done. Run `npm run android` / `npm run ios` to see the change.');
}

main().catch(console.error);
