import fs from 'node:fs/promises';

const contentPath = new URL('../src/content/experiences.json', import.meta.url);
const levels = JSON.parse(await fs.readFile(contentPath, 'utf8'));

const letterNames = {
  'letters-aleph': 'aleph',
  'letters-bet': 'bet',
};

for (const level of levels) {
  let collectibleIndex = 0;
  let targetIndex = 0;
  for (const entity of level.entities) {
    if (level.gameId === 'letters') {
      const letter = letterNames[level.id];
      if (entity.kind === 'collectible') {
        entity.visual = { assetId: `letter-${letter}-piece-${(collectibleIndex % 3) + 1}` };
        collectibleIndex += 1;
      } else if (entity.kind === 'target') {
        entity.visual = { assetId: `letter-${letter}-target-empty` };
      }
    }

    if (level.gameId === 'numbers') {
      if (entity.kind === 'collectible') {
        entity.visual = { assetId: level.id === 'numbers-five' ? 'food-strawberry' : 'food-apple' };
      } else if (entity.kind === 'target') {
        entity.visual = { assetId: 'monster-idle-1' };
      }
    }

    if (level.gameId === 'shapes') {
      if (entity.kind === 'collectible') {
        entity.visual = { assetId: `shape-${entity.accepts}` };
      } else if (entity.kind === 'target') {
        entity.visual = { assetId: `socket-${entity.accepts}-empty` };
      }
    }

    if (level.gameId === 'colors') {
      if (entity.kind === 'station') {
        entity.visual = {
          assetId: `paint-pot-${entity.id}-full`,
          heldAssetId: `brush-loaded-${entity.id}`,
        };
      } else if (entity.kind === 'target') {
        targetIndex += 1;
        entity.visual = level.id === 'colors-balloons'
          ? { assetId: 'balloon-uncoloured', state: entity.accepts }
          : { assetId: `flower-${targetIndex}-uncoloured`, state: entity.accepts };
      }
    }

    delete entity.imageAssetId;
    delete entity.sprite;
  }
}

await fs.writeFile(contentPath, `${JSON.stringify(levels, null, 2)}\n`, 'utf8');
console.log(`Migrated ${levels.length} experience levels to manifest visuals`);
