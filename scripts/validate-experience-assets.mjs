import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const characterManifest = JSON.parse(await fs.readFile(path.join(root, 'src', 'content', 'character-atlases.json'), 'utf8'));
const assetManifest = JSON.parse(await fs.readFile(path.join(root, 'src', 'content', 'experience-assets.json'), 'utf8'));
const levels = JSON.parse(await fs.readFile(path.join(root, 'src', 'content', 'experiences.json'), 'utf8'));
const errors = [];

function localPath(publicPath) {
  return path.join(root, 'public', publicPath.replace(/^\/+/, '').replaceAll('/', path.sep));
}

async function assertImage(publicPath, expectedWidth, expectedHeight, label) {
  const file = localPath(publicPath);
  try {
    const stats = await fs.stat(file);
    const metadata = await sharp(file).metadata();
    if (metadata.width !== expectedWidth || metadata.height !== expectedHeight) {
      errors.push(`${label}: expected ${expectedWidth}x${expectedHeight}, got ${metadata.width}x${metadata.height}`);
    }
    if (!metadata.hasAlpha) errors.push(`${label}: image has no alpha channel`);
    const corner = await sharp(file).ensureAlpha().extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
    if (corner[3] !== 0) errors.push(`${label}: top-left corner is not transparent`);
    return stats.size;
  } catch (error) {
    errors.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    return 0;
  }
}

const requiredSkins = ['nir-kippah', 'nir-plain', 'shir'];
for (const skin of requiredSkins) {
  const atlas = characterManifest.atlases[skin];
  if (!atlas) {
    errors.push(`Missing character atlas: ${skin}`);
    continue;
  }
  if (atlas.frames.length !== 49) errors.push(`${skin}: expected 49 frames`);
  if (atlas.grid.columns !== 8 || atlas.grid.rows !== 7) errors.push(`${skin}: expected 8x7 grid`);
  const frameNames = new Set(atlas.frames.map((frame) => frame.name));
  if (frameNames.size !== 49) errors.push(`${skin}: frame names are not unique`);
  for (const clipName of ['walk_front', 'walk_back', 'walk_side', 'carry_front', 'carry_back', 'carry_side']) {
    const clip = atlas.animations.find((candidate) => candidate.key === clipName);
    if (!clip || clip.frames.length !== 6 || clip.frameRate !== 12) {
      errors.push(`${skin}: ${clipName} must contain six frames at 12fps`);
    }
  }
  for (const clip of atlas.animations) {
    for (const frame of clip.frames) {
      if (!frameNames.has(frame)) errors.push(`${skin}: ${clip.key} references missing frame ${frame}`);
    }
  }
  const webpSize = await assertImage(atlas.webp, 2048, 2240, `${skin} WebP`);
  await assertImage(atlas.png, 2048, 2240, `${skin} PNG`);
  if (webpSize > 3_000_000) errors.push(`${skin}: runtime WebP exceeds 3MB`);
  if (`${atlas.webp}${atlas.png}`.includes('placeholder')) errors.push(`${skin}: placeholder path is forbidden`);
}

const assetEntries = assetManifest.entries;
if (Object.keys(assetEntries).length < 250) errors.push('Experience manifest is missing required prop coverage');
for (const [assetId, asset] of Object.entries(assetEntries)) {
  if (assetId.toLowerCase().includes('placeholder') || asset.webp.includes('placeholder') || asset.png.includes('placeholder')) {
    errors.push(`${assetId}: placeholder asset is forbidden`);
  }
  await assertImage(asset.webp, 512, 512, `${assetId} WebP`);
}

for (const level of levels) {
  for (const entity of level.entities) {
    if ('imageAssetId' in entity || 'sprite' in entity) {
      errors.push(`${level.id}/${entity.id}: legacy sprite reference is forbidden`);
    }
    const visual = entity.visual;
    if (!visual?.assetId) {
      errors.push(`${level.id}/${entity.id}: missing visual asset`);
      continue;
    }
    if (!assetEntries[visual.assetId]) errors.push(`${level.id}/${entity.id}: unknown asset ${visual.assetId}`);
    if (visual.heldAssetId && !assetEntries[visual.heldAssetId]) {
      errors.push(`${level.id}/${entity.id}: unknown held asset ${visual.heldAssetId}`);
    }
  }
}

const publicFiles = await fs.readdir(path.join(root, 'public', 'assets', 'experience', 'characters'));
if (publicFiles.some((file) => file.includes('master') || file.includes('4096'))) {
  errors.push('Master character atlases must not be served from public/');
}

if (errors.length) {
  console.error(`Experience asset validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validated ${requiredSkins.length} character atlases and ${Object.keys(assetEntries).length} experience assets`);
