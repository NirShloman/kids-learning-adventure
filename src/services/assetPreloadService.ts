import { ImageAssetId, imageAssets } from '../assets/assetManifest';

const loadedAssets = new Set<ImageAssetId>();

export function preloadImageAssets(assetIds: ImageAssetId[]): void {
  if (typeof window === 'undefined') return;

  assetIds.forEach((assetId) => {
    if (loadedAssets.has(assetId)) return;
    const src = imageAssets[assetId];
    if (!src) return;
    const image = new Image();
    image.src = src;
    loadedAssets.add(assetId);
  });
}

export function preloadCriticalAssets(): void {
  preloadImageAssets(['bgLanding', 'guideHappy', 'starReward']);
}
