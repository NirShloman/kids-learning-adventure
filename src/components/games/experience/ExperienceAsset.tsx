import type { CSSProperties } from 'react';
import { getExperienceAsset } from './experienceAssetManifest';

interface ExperienceAssetProps {
  assetId?: string;
  alt?: string;
  decorative?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function ExperienceAsset({
  assetId,
  alt = '',
  decorative = true,
  className,
  style
}: ExperienceAssetProps) {
  const asset = getExperienceAsset(assetId);
  if (!asset) return null;
  return (
    <picture className={className ? `${className}__picture` : undefined}>
      <source srcSet={asset.webp} type="image/webp" />
      <img
        className={className}
        src={asset.png}
        width={asset.width}
        height={asset.height}
        alt={decorative ? '' : alt}
        aria-hidden={decorative || undefined}
        loading="eager"
        decoding="async"
        draggable={false}
        style={style}
      />
    </picture>
  );
}
