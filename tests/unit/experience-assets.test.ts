import { describe, expect, it } from 'vitest';
import levels from '../../src/content/experiences.json';
import {
  getAnimationDurationMs,
  getCharacterAtlas,
  getExperienceAsset,
  resolveCharacterFrame,
  resolveCharacterSkin
} from '../../src/components/games/experience/experienceAssetManifest';

describe('experience character atlases', () => {
  it('maps learner gender to the approved default skin', () => {
    expect(resolveCharacterSkin('boy')).toBe('nir-kippah');
    expect(resolveCharacterSkin('girl')).toBe('shir');
  });

  it.each(['nir-kippah', 'nir-plain', 'shir'] as const)('contains 49 valid frames for %s', (skin) => {
    const atlas = getCharacterAtlas(skin);
    expect(atlas.frames).toHaveLength(49);
    expect(new Set(atlas.frames.map((frame) => frame.name)).size).toBe(49);
    expect(atlas.grid).toEqual({ columns: 8, rows: 7 });
  });

  it('advances through six distinct walk frames at 12fps', () => {
    const names = Array.from({ length: 6 }, (_, index) =>
      resolveCharacterFrame('nir-kippah', 'walk', 'right', index * 5, 0, false).frame.name
    );
    expect(new Set(names).size).toBe(6);
  });

  it('mirrors only left-facing side art and freezes reduced motion', () => {
    const right = resolveCharacterFrame('shir', 'walk', 'right', 10, 0, false);
    const left = resolveCharacterFrame('shir', 'walk', 'left', 10, 0, false);
    const reduced = resolveCharacterFrame('shir', 'walk', 'right', 50, 0, true);
    expect(right.frame.name).toBe(left.frame.name);
    expect(right.mirrored).toBe(false);
    expect(left.mirrored).toBe(true);
    expect(reduced.frame.name).toBe(right.clip.frames[0]);
  });

  it('derives one-shot action duration from the manifest', () => {
    expect(getAnimationDurationMs('nir-kippah', 'pickup')).toBe(300);
    expect(getAnimationDurationMs('shir', 'celebrate')).toBe(334);
  });
});

describe('experience visual content', () => {
  it('resolves every entity and held-state asset without legacy sprites', () => {
    for (const level of levels) {
      for (const entity of level.entities) {
        expect('imageAssetId' in entity).toBe(false);
        expect('sprite' in entity).toBe(false);
        expect(entity.visual?.assetId).toBeTruthy();
        expect(getExperienceAsset(entity.visual?.assetId)).toBeTruthy();
        if (entity.visual?.heldAssetId) {
          expect(getExperienceAsset(entity.visual.heldAssetId)).toBeTruthy();
        }
      }
    }
  });
});
