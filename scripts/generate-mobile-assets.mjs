import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const source = path.join(root, 'public', 'icons', 'icon.svg');
const background = { r: 255, g: 253, b: 248, alpha: 1 };

async function renderIcon(size, destination, padding = 0) {
  await mkdir(path.dirname(destination), { recursive: true });
  const inner = Math.round(size * (1 - padding * 2));
  const icon = await sharp(source).resize(inner, inner, { fit: 'contain' }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: icon, left: Math.round(size * padding), top: Math.round(size * padding) }])
    .png().toFile(destination);
}

async function renderSplash(width, height, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  const iconSize = Math.round(Math.min(width, height) * 0.34);
  const icon = await sharp(source).resize(iconSize, iconSize, { fit: 'contain' }).png().toBuffer();
  await sharp({ create: { width, height, channels: 4, background } })
    .composite([{ input: icon, left: Math.round((width - iconSize) / 2), top: Math.round((height - iconSize) / 2) }])
    .png().toFile(destination);
}

async function renderPoster(sourceName, destinationName) {
  const destination = path.join(root, 'public', 'assets', 'video', destinationName);
  await sharp(path.join(root, 'public', 'assets', 'images', 'backgrounds', sourceName))
    .resize(1280, 720, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(destination);
}

await renderIcon(192, path.join(root, 'public', 'icons', 'icon-192.png'));
await renderIcon(512, path.join(root, 'public', 'icons', 'icon-512.png'));
await renderIcon(512, path.join(root, 'public', 'icons', 'icon-maskable-512.png'), 0.12);

const densities = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [density, size] of Object.entries(densities)) {
  const dir = path.join(root, 'android', 'app', 'src', 'main', 'res', `mipmap-${density}`);
  await renderIcon(size, path.join(dir, 'ic_launcher.png'));
  await renderIcon(size, path.join(dir, 'ic_launcher_round.png'));
  await renderIcon(size, path.join(dir, 'ic_launcher_foreground.png'), 0.12);
}

const splashDensities = { mdpi: 480, hdpi: 720, xhdpi: 960, xxhdpi: 1440, xxxhdpi: 1920 };
for (const [density, width] of Object.entries(splashDensities)) {
  await renderSplash(width, Math.round(width * 1.6), path.join(root, 'android', 'app', 'src', 'main', 'res', `drawable-port-${density}`, 'splash.png'));
  await renderSplash(Math.round(width * 1.6), width, path.join(root, 'android', 'app', 'src', 'main', 'res', `drawable-land-${density}`, 'splash.png'));
}
await renderSplash(960, 960, path.join(root, 'android', 'app', 'src', 'main', 'res', 'drawable', 'splash.png'));
await renderIcon(1024, path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png'));
for (const suffix of ['', '-1', '-2']) {
  await renderSplash(2732, 2732, path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset', `splash-2732x2732${suffix}.png`));
}

await renderPoster('landing.jpg', 'learning-garden-welcome.poster.webp');
await renderPoster('lobby.jpg', 'learning-garden-lobby.poster.webp');
await renderPoster('numbers.jpg', 'counting-orchard.poster.webp');

console.log('Generated PWA, native icons/splashes, and WebP video posters.');
