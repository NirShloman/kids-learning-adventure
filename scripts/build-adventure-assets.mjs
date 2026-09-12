import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "docs/art-direction/adventure-v2");
const out = path.join(root, "public/assets/experience/v2");
await fs.mkdir(out, { recursive: true });
const assets = [];
for (const game of ["letters", "numbers", "shapes", "colors"]) {
  const file = `${game}.webp`;
  await sharp(path.join(source, `${game}.png`))
    .resize(1536, 1024, { fit: "cover" })
    .webp({ quality: 86 })
    .toFile(path.join(out, file));
  assets.push({
    id: game,
    path: `/assets/experience/v2/${file}`,
    kind: "background",
    width: 1536,
    height: 1024,
  });
}
// ImageGen delivered opaque chroma source. Extract alpha as a reproducible asset-build step.
const { data, info } = await sharp(path.join(source, "monster-chroma.png"))
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  const r = data[i],
    g = data[i + 1],
    b = data[i + 2];
  const magenta = Math.min(r, b) - g;
  if (magenta > 65 && r > 100 && b > 100)
    data[i + 3] = Math.round(255 * Math.max(0, 1 - (magenta - 65) / 45));
}
const monster = await sharp(data, { raw: info }).png().toBuffer();
const cellWidth = Math.floor(info.width / 2),
  cellHeight = Math.floor(info.height / 2);
for (let index = 0; index < 4; index++) {
  const pose = ["idle", "ready", "eat", "celebrate"][index];
  const file = `monster-${pose}.webp`;
  const cell = await sharp(monster)
    .extract({
      left: (index % 2) * cellWidth,
      top: Math.floor(index / 2) * cellHeight,
      width: cellWidth,
      height: cellHeight,
    })
    .png()
    .toBuffer();
  await sharp(cell)
    .trim({ threshold: 8 })
    .resize(384, 384, { fit: "contain", background: "#00000000" })
    .webp({ quality: 90 })
    .toFile(path.join(out, file));
  assets.push({
    id: `monster-${pose}`,
    path: `/assets/experience/v2/${file}`,
    kind: "cutout",
    width: 384,
    height: 384,
  });
}
const atlases = JSON.parse(
  await fs.readFile(
    path.join(root, "src/content/character-atlases.json"),
    "utf8",
  ),
).atlases;
for (const skin of ["nir-kippah", "nir-plain", "shir"]) {
  const atlas = atlases[skin];
  for (const [pose, clipKey] of [
    ["idle", "idle_front"],
    ["point", "carry_front"],
    ["celebrate", "celebrate"],
  ]) {
    const clip = atlas.animations.find((c) => c.key === clipKey);
    const frame = atlas.frames.find(
      (f) => f.name === clip.frames[pose === "celebrate" ? 1 : 0],
    );
    const file = `${skin}-${pose}.webp`;
    const cell = await sharp(path.join(root, "public", atlas.png))
      .extract({ left: frame.x, top: frame.y, width: frame.w, height: frame.h })
      .png()
      .toBuffer();
    await sharp(cell)
      .trim({ threshold: 8 })
      .resize(256, 320, { fit: "contain", background: "#00000000" })
      .webp({ quality: 90 })
      .toFile(path.join(out, file));
    assets.push({
      id: `${skin}-${pose}`,
      path: `/assets/experience/v2/${file}`,
      kind: "cutout",
      width: 256,
      height: 320,
    });
  }
}
await fs.writeFile(
  path.join(root, "src/content/adventure-assets.json"),
  JSON.stringify({ version: 1, assets }, null, 2) + "\n",
);
console.log(`Built ${assets.length} adventure assets`);
