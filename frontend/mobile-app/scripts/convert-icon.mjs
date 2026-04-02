import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'assets');

const svgBuffer = readFileSync(join(assetsDir, 'icon.svg'));

// icon.png — 1024x1024
await sharp(svgBuffer).resize(1024, 1024).png().toFile(join(assetsDir, 'icon.png'));
console.log('✅ icon.png (1024x1024)');

// adaptive-icon.png — 1024x1024 (foreground, no rounded corners needed)
await sharp(svgBuffer).resize(1024, 1024).png().toFile(join(assetsDir, 'adaptive-icon.png'));
console.log('✅ adaptive-icon.png (1024x1024)');

// splash-icon.png — 200x200 centered on white
await sharp(svgBuffer)
  .resize(200, 200)
  .png()
  .toFile(join(assetsDir, 'splash-icon.png'));
console.log('✅ splash-icon.png (200x200)');

// favicon.png — 48x48
await sharp(svgBuffer).resize(48, 48).png().toFile(join(assetsDir, 'favicon.png'));
console.log('✅ favicon.png (48x48)');

console.log('\nAll icons generated.');
