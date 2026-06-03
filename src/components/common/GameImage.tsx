import { ImageAssetId, imageAssets } from '../../assets/assetManifest';

interface GameImageProps {
  assetId?: ImageAssetId;
  alt: string;
  className?: string;
  decorative?: boolean;
}

export function GameImage({ assetId, alt, className, decorative = false }: GameImageProps) {
  if (!assetId || !imageAssets[assetId]) {
    return null;
  }

  return (
    <img
      className={className}
      src={imageAssets[assetId]}
      alt={decorative ? '' : alt}
      aria-hidden={decorative || undefined}
      loading="lazy"
      decoding="async"
    />
  );
}
