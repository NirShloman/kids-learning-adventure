import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const brandSourceDir = path.join(root, 'assets', 'brand', 'source');
const horizontalLogoSource = path.join(brandSourceDir, 'yadaale_logo_horizontal.png');
const appIconSource = path.join(brandSourceDir, 'yadaale_app_icon_1024.png');
const smallMarkSource = path.join(brandSourceDir, 'yadaale_small_icon_1024.png');
const background = { r: 255, g: 253, b: 248, alpha: 1 };
const brandPurple = { r: 43, g: 23, b: 106, alpha: 1 };
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

async function removeBakedLightBackground(source) {
  const { data, info } = await sharp(source).trim().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixelCount = info.width * info.height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Uint32Array(pixelCount);
  let head = 0;
  let tail = 0;

  function isLightNeutral(index) {
    const offset = index * 4;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    return Math.min(red, green, blue) >= 232 && Math.max(red, green, blue) - Math.min(red, green, blue) <= 14;
  }

  function enqueue(index) {
    if (visited[index] || !isLightNeutral(index)) return;
    visited[index] = 1;
    queue[tail++] = index;
  }

  for (let x = 0; x < info.width; x += 1) {
    enqueue(x);
    enqueue((info.height - 1) * info.width + x);
  }
  for (let y = 0; y < info.height; y += 1) {
    enqueue(y * info.width);
    enqueue(y * info.width + info.width - 1);
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % info.width;
    const y = Math.floor(index / info.width);
    data[index * 4 + 3] = 0;
    if (x > 0) enqueue(index - 1);
    if (x + 1 < info.width) enqueue(index + 1);
    if (y > 0) enqueue(index - info.width);
    if (y + 1 < info.height) enqueue(index + info.width);
  }

  return sharp(data, { raw: info }).png().toBuffer();
}

let cleanHorizontalLogo;
let cleanSmallMark;

async function getHorizontalLogo() {
  cleanHorizontalLogo ??= removeBakedLightBackground(horizontalLogoSource);
  return cleanHorizontalLogo;
}

async function getSmallMark() {
  cleanSmallMark ??= removeBakedLightBackground(smallMarkSource);
  return cleanSmallMark;
}

async function renderAppIcon(size, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  await sharp(appIconSource)
    .resize(size, size, { fit: 'cover' })
    .flatten({ background })
    .removeAlpha()
    .png().toFile(destination);
}

async function renderCenteredArtwork(source, size, destination, coverage, canvasBackground = transparent) {
  await mkdir(path.dirname(destination), { recursive: true });
  const inner = Math.round(size * coverage);
  const artwork = await sharp(source)
    .trim()
    .resize(inner, inner, { fit: 'contain', background: transparent })
    .png()
    .toBuffer();
  const metadata = await sharp(artwork).metadata();
  await sharp({ create: { width: size, height: size, channels: 4, background: canvasBackground } })
    .composite([{
      input: artwork,
      left: Math.round((size - metadata.width) / 2),
      top: Math.round((size - metadata.height) / 2)
    }])
    .png()
    .toFile(destination);
}

async function writeWebBrandAssets() {
  const destinationDir = path.join(root, 'public', 'assets', 'brand');
  await mkdir(destinationDir, { recursive: true });
  await sharp(await getHorizontalLogo())
    .trim()
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(path.join(destinationDir, 'yadaale-logo-horizontal.webp'));
  await sharp(await getSmallMark())
    .trim()
    .resize({ width: 512, withoutEnlargement: true })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(path.join(destinationDir, 'yadaale-mark.webp'));
}

async function renderSplash(width, height, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  const logo = await sharp(await getHorizontalLogo())
    .trim()
    .resize({
      width: Math.round(width * (width > height ? 0.46 : 0.7)),
      height: Math.round(height * 0.32),
      fit: 'inside'
    })
    .png()
    .toBuffer();
  const metadata = await sharp(logo).metadata();
  await sharp({ create: { width, height, channels: 4, background } })
    .composite([{
      input: logo,
      left: Math.round((width - metadata.width) / 2),
      top: Math.round((height - metadata.height) / 2)
    }])
    .png().toFile(destination);
}

async function renderPoster(sourceName, destinationName) {
  const destination = path.join(root, 'public', 'assets', 'video', destinationName);
  await sharp(path.join(root, 'public', 'assets', 'images', 'backgrounds', sourceName))
    .resize(1280, 720, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(destination);
}

await writeWebBrandAssets();
await renderAppIcon(32, path.join(root, 'public', 'icons', 'favicon-32.png'));
await renderAppIcon(180, path.join(root, 'public', 'icons', 'apple-touch-icon.png'));
await renderAppIcon(192, path.join(root, 'public', 'icons', 'icon-192.png'));
await renderAppIcon(512, path.join(root, 'public', 'icons', 'icon-512.png'));
await renderCenteredArtwork(await getSmallMark(), 512, path.join(root, 'public', 'icons', 'icon-maskable-512.png'), 0.7, brandPurple);

const densities = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [density, size] of Object.entries(densities)) {
  const dir = path.join(root, 'android', 'app', 'src', 'main', 'res', `mipmap-${density}`);
  await renderAppIcon(size, path.join(dir, 'ic_launcher.png'));
  await renderAppIcon(size, path.join(dir, 'ic_launcher_round.png'));
}

const adaptiveForegroundSizes = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
for (const [density, size] of Object.entries(adaptiveForegroundSizes)) {
  const destination = path.join(root, 'android', 'app', 'src', 'main', 'res', `mipmap-${density}`, 'ic_launcher_foreground.png');
  await renderCenteredArtwork(await getSmallMark(), size, destination, 0.66);
}

const splashDensities = { mdpi: 480, hdpi: 720, xhdpi: 960, xxhdpi: 1440, xxxhdpi: 1920 };
for (const [density, width] of Object.entries(splashDensities)) {
  await renderSplash(width, Math.round(width * 1.6), path.join(root, 'android', 'app', 'src', 'main', 'res', `drawable-port-${density}`, 'splash.png'));
  await renderSplash(Math.round(width * 1.6), width, path.join(root, 'android', 'app', 'src', 'main', 'res', `drawable-land-${density}`, 'splash.png'));
}
await renderSplash(960, 960, path.join(root, 'android', 'app', 'src', 'main', 'res', 'drawable', 'splash.png'));
await renderAppIcon(1024, path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png'));
for (const suffix of ['', '-1', '-2']) {
  await renderSplash(2732, 2732, path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset', `splash-2732x2732${suffix}.png`));
}

await renderPoster('landing.jpg', 'learning-garden-welcome.poster.webp');
await renderPoster('lobby.jpg', 'learning-garden-lobby.poster.webp');
await renderPoster('numbers.jpg', 'counting-orchard.poster.webp');

console.log('Generated branded web assets, PWA/native icons, splashes, and WebP video posters.');
