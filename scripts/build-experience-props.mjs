import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outputRoot = path.join(root, 'public', 'assets', 'experience', 'generated');
const manifestPath = path.join(root, 'src', 'content', 'experience-assets.json');
const sourceRoot = path.join(root, 'docs', 'art-direction', 'claude-design', 'props-source');
const entries = {};

const palette = {
  teal: '#1bb8b2',
  tealDark: '#117f86',
  cream: '#fff8e8',
  yellow: '#ffd75e',
  coral: '#ff8f84',
  blue: '#65bff2',
  green: '#76cf9d',
  purple: '#9b7ad8',
  ink: '#263b58',
};

const escapeXml = (value) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
})[character]);

function svgFrame(content, { shadow = true } = {}) {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <defs>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8"/>
        </filter>
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="12" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="toy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity=".72"/>
          <stop offset=".32" stop-color="#ffffff" stop-opacity=".08"/>
          <stop offset="1" stop-color="#17314b" stop-opacity=".18"/>
        </linearGradient>
      </defs>
      ${shadow ? '<ellipse cx="256" cy="444" rx="145" ry="24" fill="#173b4f" opacity=".16" filter="url(#soft)"/>' : ''}
      ${content}
    </svg>
  `);
}

async function writeAsset(assetId, world, input, source = 'generated') {
  const directory = path.join(outputRoot, world);
  await fs.mkdir(directory, { recursive: true });
  const pngFile = path.join(directory, `${assetId}.png`);
  const webpFile = path.join(directory, `${assetId}.webp`);
  const pipeline = sharp(input, { density: 144 }).resize(512, 512, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  await pipeline.clone().png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(pngFile);
  await pipeline.clone().webp({ quality: 86, alphaQuality: 100, smartSubsample: true }).toFile(webpFile);
  entries[assetId] = {
    id: assetId,
    world,
    png: `/assets/experience/generated/${world}/${assetId}.png`,
    webp: `/assets/experience/generated/${world}/${assetId}.webp`,
    width: 512,
    height: 512,
    source,
  };
}

async function importClaude(assetId, world, relativeSource) {
  await writeAsset(assetId, world, path.join(sourceRoot, relativeSource), 'claude-design');
}

function roundedToy(fill, inner = '') {
  return svgFrame(`
    <rect x="94" y="92" width="324" height="324" rx="88" fill="${fill}" stroke="#fff" stroke-width="13"/>
    <rect x="106" y="104" width="300" height="300" rx="76" fill="url(#toy)"/>
    ${inner}
  `);
}

function shapeMarkup(shape, fill, stroke = '#fff', strokeWidth = 12, dashed = false) {
  const common = `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dashed ? 'stroke-dasharray="18 14"' : ''}`;
  if (shape === 'circle') return `<circle cx="256" cy="250" r="142" ${common}/>`;
  if (shape === 'square') return `<rect x="116" y="110" width="280" height="280" rx="52" ${common}/>`;
  if (shape === 'triangle') return `<path d="M256 80 L428 394 L84 394 Z" stroke-linejoin="round" ${common}/>`;
  if (shape === 'rectangle') return `<rect x="70" y="150" width="372" height="210" rx="48" ${common}/>`;
  if (shape === 'star') return `<path d="M256 66 304 182 430 190 334 273 364 397 256 330 148 397 178 273 82 190 208 182Z" stroke-linejoin="round" ${common}/>`;
  if (shape === 'hexagon') return `<path d="M154 82 H358 L458 256 358 430 H154 L54 256Z" stroke-linejoin="round" ${common}/>`;
  if (shape === 'semicircle') return `<path d="M84 342 A172 172 0 0 1 428 342 Z" ${common}/>`;
  return `<path d="M106 398 V230 A150 150 0 0 1 406 230 V398 H326 V234 A70 70 0 0 0 186 234 V398Z" ${common}/>`;
}

function shapeAsset(shape, fill, state = 'piece') {
  const socket = state !== 'piece';
  const stateFill = state === 'locked' ? fill : state === 'hover' ? `${fill}55` : '#ffffff22';
  const stroke = state === 'hover' ? palette.yellow : state === 'locked' ? '#ffffff' : palette.tealDark;
  return svgFrame(`
    ${shapeMarkup(shape, stateFill, stroke, socket ? 16 : 12, state === 'empty')}
    ${socket ? '' : shapeMarkup(shape, 'url(#toy)', '#ffffff44', 5)}
  `);
}

function letterAsset(letter, part) {
  const colors = [palette.purple, palette.teal, palette.coral];
  return roundedToy(colors[(part - 1) % colors.length], `
    <text x="256" y="316" text-anchor="middle" font-family="Arial, sans-serif" font-size="210" font-weight="800" fill="${palette.cream}">${escapeXml(letter)}</text>
    <circle cx="${190 + part * 34}" cy="378" r="10" fill="${palette.yellow}"/>
  `);
}

function letterTarget(letter, state) {
  const filled = state === 'filled-glow';
  const opacity = state === 'partial' ? 0.46 : filled ? 1 : 0.2;
  return svgFrame(`
    <rect x="82" y="70" width="348" height="358" rx="78" fill="${filled ? '#fff7d4' : '#ffffffaa'}"
      stroke="${filled ? palette.yellow : palette.tealDark}" stroke-width="16"
      ${state === 'empty' ? 'stroke-dasharray="24 18"' : ''} ${filled ? 'filter="url(#glow)"' : ''}/>
    <text x="256" y="330" text-anchor="middle" font-family="Arial, sans-serif" font-size="238" font-weight="800"
      fill="${filled ? palette.purple : palette.ink}" opacity="${opacity}">${escapeXml(letter)}</text>
  `);
}

function simpleProp(kind, color = palette.teal) {
  const shapes = {
    crate: `<rect x="88" y="144" width="336" height="260" rx="34" fill="#d6a56e" stroke="#fff" stroke-width="12"/><path d="M110 190H402M148 150V396M364 150V396" stroke="#9b673d" stroke-width="18"/>`,
    conveyor: `<rect x="48" y="180" width="416" height="154" rx="56" fill="#566a7f" stroke="#fff" stroke-width="12"/><g fill="#b9c9d8">${[100,180,260,340,420].map((x) => `<circle cx="${x}" cy="257" r="38"/>`).join('')}</g>`,
    basket: `<path d="M94 214H418L374 414H138Z" fill="#d6a56e" stroke="#fff" stroke-width="12"/><path d="M148 220Q256 52 364 220" fill="none" stroke="#9b673d" stroke-width="28"/>`,
    delivery: `<ellipse cx="256" cy="322" rx="190" ry="94" fill="#fff" stroke="${palette.yellow}" stroke-width="18"/><ellipse cx="256" cy="322" rx="116" ry="48" fill="${palette.yellow}" opacity=".42"/>`,
    workbench: `<rect x="64" y="162" width="384" height="100" rx="30" fill="#c3a986" stroke="#fff" stroke-width="12"/><path d="M110 254V426M402 254V426" stroke="#8b6b4b" stroke-width="34" stroke-linecap="round"/>`,
    bush: `<g fill="${color}" stroke="#fff" stroke-width="10"><circle cx="162" cy="292" r="92"/><circle cx="256" cy="220" r="116"/><circle cx="354" cy="292" r="92"/></g>`,
    rainbow: `<path d="M72 392A184 184 0 0 1 440 392" fill="none" stroke="#ff8f84" stroke-width="52"/><path d="M100 392A156 156 0 0 1 412 392" fill="none" stroke="#ffd75e" stroke-width="42"/><path d="M128 392A128 128 0 0 1 384 392" fill="none" stroke="#65bff2" stroke-width="36"/>`,
    sun: `<circle cx="256" cy="250" r="126" fill="${color}" stroke="#fff" stroke-width="12"/><g stroke="${color}" stroke-width="26" stroke-linecap="round">${[[256,52,256,92],[256,408,256,448],[58,250,98,250],[414,250,454,250],[116,110,144,138],[368,362,396,390],[396,110,368,138],[144,362,116,390]].map(([x1,y1,x2,y2])=>`<path d="M${x1} ${y1}L${x2} ${y2}"/>`).join('')}</g>`,
    part: `<rect x="112" y="126" width="288" height="258" rx="62" fill="${color}" stroke="#fff" stroke-width="12"/><circle cx="184" cy="206" r="22" fill="#ffffffaa"/><circle cx="328" cy="206" r="22" fill="#ffffffaa"/>`,
  };
  return svgFrame(shapes[kind] ?? shapes.part);
}

function foodAsset(food) {
  const body = {
    banana: `<path d="M126 138Q192 382 404 300Q348 430 192 388Q86 324 126 138Z" fill="#ffd75e" stroke="#fff" stroke-width="12"/>`,
    grapes: `<g fill="#8f69d4" stroke="#fff" stroke-width="7">${[[200,160],[260,150],[320,170],[178,220],[242,215],[306,230],[210,282],[272,286],[244,344]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="52"/>`).join('')}</g>`,
    carrot: `<path d="M178 152Q256 450 334 152Z" fill="#ff9a55" stroke="#fff" stroke-width="12"/><path d="M210 150Q180 74 232 92M256 148Q256 60 286 92M298 150Q348 78 326 130" stroke="#63bd84" stroke-width="30" stroke-linecap="round"/>`,
    cookie: `<circle cx="256" cy="254" r="160" fill="#d89d5b" stroke="#fff" stroke-width="12"/><g fill="#68472f">${[[182,170],[298,144],[342,260],[222,286],[166,340],[300,362]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="18"/>`).join('')}</g>`,
    cheese: `<path d="M80 360 404 116 426 390 80 390Z" fill="#ffd75e" stroke="#fff" stroke-width="12"/><g fill="#e7a93f"><circle cx="300" cy="220" r="30"/><circle cx="180" cy="336" r="24"/><circle cx="348" cy="338" r="20"/></g>`,
    pear: `<path d="M256 86Q210 142 222 194Q108 254 140 368Q176 454 256 430Q336 454 372 368Q404 254 290 194Q302 142 256 86Z" fill="#9fd36d" stroke="#fff" stroke-width="12"/>`,
    tomato: `<circle cx="256" cy="274" r="150" fill="#f36b61" stroke="#fff" stroke-width="12"/><path d="M256 116 286 178 360 150 316 216 386 236 300 242 256 302 218 242 130 236 198 216 154 150 226 178Z" fill="#65bd82"/>`,
  }[food];
  return svgFrame(body);
}

function potAsset(color, used) {
  return svgFrame(`
    <path d="M126 180H386L352 410H160Z" fill="${color}" stroke="#fff" stroke-width="12"/>
    <ellipse cx="256" cy="180" rx="130" ry="48" fill="${used ? '#ffffff99' : color}" stroke="#fff" stroke-width="12"/>
    ${used ? '<path d="M160 178Q256 224 352 178" stroke="#7b6c75" stroke-width="10" opacity=".35"/>' : ''}
  `);
}

function brushAsset(color = null) {
  return svgFrame(`
    <g transform="rotate(34 256 256)">
      <rect x="226" y="180" width="60" height="242" rx="28" fill="#d59a55" stroke="#fff" stroke-width="10"/>
      <rect x="214" y="150" width="84" height="78" rx="18" fill="#b9c4ca"/>
      <path d="M220 154Q256 48 292 154Z" fill="${color ?? '#7d4d35'}" stroke="#fff" stroke-width="9"/>
    </g>
  `);
}

function flowerAsset(color, variant, uncoloured) {
  const petal = uncoloured ? '#fffdf8' : color;
  const rotations = [0, 60, 120, 180, 240, 300];
  return svgFrame(`
    <path d="M256 250V432" stroke="#62bd83" stroke-width="26" stroke-linecap="round"/>
    <g transform="rotate(${variant * 7} 256 232)">
      ${rotations.map((rotation) => `<ellipse cx="256" cy="132" rx="${48 + variant * 2}" ry="88" fill="${petal}" stroke="#fff" stroke-width="10" transform="rotate(${rotation} 256 232)"/>`).join('')}
      <circle cx="256" cy="232" r="58" fill="${uncoloured ? '#e8edf2' : palette.yellow}" stroke="#fff" stroke-width="10"/>
    </g>
  `);
}

function balloonAsset(color) {
  return svgFrame(`
    <ellipse cx="256" cy="202" rx="126" ry="154" fill="${color}" stroke="#fff" stroke-width="12"/>
    <path d="M256 356 232 386H280Z" fill="${color}"/>
    <path d="M256 384Q214 430 256 476" fill="none" stroke="#7c7280" stroke-width="8"/>
    <ellipse cx="216" cy="148" rx="26" ry="52" fill="#fff" opacity=".42"/>
  `, { shadow: false });
}

const colorMap = {
  red: '#ef6f68', blue: '#59b8ef', yellow: '#ffd45c', green: '#72c891', orange: '#f5a75e', purple: '#9878d2',
};

async function main() {
  await fs.mkdir(outputRoot, { recursive: true });

  const letters = [...'אבגדהוזחטיכלמנסעפצקרשת'];
  const letterNames = ['aleph','bet','gimel','dalet','he','vav','zayin','het','tet','yod','kaf','lamed','mem','nun','samekh','ayin','pe','tsadi','qof','resh','shin','tav'];
  for (let index = 0; index < letters.length; index += 1) {
    for (let part = 1; part <= 3; part += 1) {
      await writeAsset(`letter-${letterNames[index]}-piece-${part}`, 'letter-factory', letterAsset(letters[index], part));
    }
    for (const state of ['empty', 'partial', 'filled-glow']) {
      await writeAsset(`letter-${letterNames[index]}-target-${state}`, 'letter-factory', letterTarget(letters[index], state));
    }
  }
  await writeAsset('letter-crate-closed', 'letter-factory', simpleProp('crate'));
  await writeAsset('letter-crate-open', 'letter-factory', simpleProp('crate'));
  await writeAsset('letter-conveyor-straight', 'letter-factory', simpleProp('conveyor'));
  await writeAsset('letter-conveyor-corner', 'letter-factory', simpleProp('conveyor'));
  await importClaude('reward-star', 'shared', path.join('letter_factory', 'prop_letters_reward_star.png'));

  await importClaude('monster-idle-base', 'feed-the-monster', path.join('feed_the_monster', 'prop_monster_monster_idle.png'));
  const monsterSource = path.join(sourceRoot, 'feed_the_monster', 'prop_monster_monster_idle.png');
  for (const state of ['idle', 'chew', 'cheer']) {
    for (let frame = 1; frame <= 4; frame += 1) {
      const angle = state === 'cheer' ? [-2, 2, -3, 1][frame - 1] : 0;
      const top = state === 'cheer' ? [0, -10, -20, -6][frame - 1] : state === 'chew' ? [0, 3, 0, -2][frame - 1] : 0;
      const transformed = await sharp(monsterSource)
        .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .extend({ top: Math.max(0, 20 + top), bottom: Math.max(0, 20 - top), left: 20, right: 20, background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png().toBuffer();
      await writeAsset(`monster-${state}-${frame}`, 'feed-the-monster', transformed, 'claude-derived');
    }
  }
  await importClaude('food-apple', 'feed-the-monster', path.join('feed_the_monster', 'prop_monster_food_apple.png'));
  await importClaude('food-strawberry', 'feed-the-monster', path.join('feed_the_monster', 'prop_monster_food_strawberry.png'));
  for (const food of ['banana', 'grapes', 'carrot', 'cookie', 'cheese', 'pear', 'tomato']) {
    await writeAsset(`food-${food}`, 'feed-the-monster', foodAsset(food));
  }
  await writeAsset('basket-empty', 'feed-the-monster', simpleProp('basket'));
  await writeAsset('basket-full', 'feed-the-monster', simpleProp('basket'));
  await writeAsset('delivery-idle', 'feed-the-monster', simpleProp('delivery'));
  await writeAsset('delivery-highlight', 'feed-the-monster', simpleProp('delivery'));

  const shapeColors = {
    circle: colorMap.blue, square: colorMap.yellow, triangle: colorMap.red, rectangle: colorMap.green,
    star: colorMap.purple, hexagon: colorMap.orange, semicircle: '#67c9c3', arch: '#ef91b8',
  };
  for (const [shape, color] of Object.entries(shapeColors)) {
    await writeAsset(`shape-${shape}`, 'building-workshop', shapeAsset(shape, color));
    for (const state of ['empty', 'hover', 'locked']) {
      await writeAsset(`socket-${shape}-${state}`, 'building-workshop', shapeAsset(shape, color, state));
    }
  }
  for (const part of ['house-wall','house-roof','house-door','house-window','house-chimney','robot-head','robot-torso','robot-arm','robot-leg','robot-antenna','vehicle-body','vehicle-wheel','vehicle-cabin','vehicle-light']) {
    await writeAsset(part, 'building-workshop', simpleProp('part', part.includes('robot') ? palette.purple : part.includes('vehicle') ? palette.blue : palette.coral));
  }
  await writeAsset('workbench', 'building-workshop', simpleProp('workbench'));

  await writeAsset('brush-clean', 'magic-garden', brushAsset());
  for (const [name, color] of Object.entries(colorMap)) {
    await writeAsset(`brush-loaded-${name}`, 'magic-garden', brushAsset(color));
    await writeAsset(`paint-pot-${name}-full`, 'magic-garden', potAsset(color, false));
    await writeAsset(`paint-pot-${name}-used`, 'magic-garden', potAsset(color, true));
    await writeAsset(`balloon-${name}`, 'magic-garden', balloonAsset(color));
  }
  await writeAsset('balloon-uncoloured', 'magic-garden', balloonAsset('#f4f3ef'));
  for (let variant = 1; variant <= 5; variant += 1) {
    await writeAsset(`flower-${variant}-uncoloured`, 'magic-garden', flowerAsset(colorMap.red, variant, true));
    await writeAsset(`flower-${variant}-coloured`, 'magic-garden', flowerAsset(Object.values(colorMap)[(variant - 1) % 6], variant, false));
  }
  await writeAsset('sun-uncoloured', 'magic-garden', simpleProp('sun', '#f5f3e9'));
  await writeAsset('sun-coloured', 'magic-garden', simpleProp('sun', colorMap.yellow));
  await writeAsset('sun-happy', 'magic-garden', simpleProp('sun', colorMap.yellow));
  await writeAsset('bush-small', 'magic-garden', simpleProp('bush', '#74c695'));
  await writeAsset('bush-large', 'magic-garden', simpleProp('bush', '#58b884'));
  await writeAsset('rainbow-arc', 'magic-garden', simpleProp('rainbow'));

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    entries,
  };
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Built ${Object.keys(entries).length} experience assets`);
}

await main();
