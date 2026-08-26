import { useId } from 'react';
import { brand } from '../../config/brand';

interface BrandLogoProps {
  className?: string;
  decorative?: boolean;
  tagline?: string;
  variant?: 'full' | 'mark';
}

export function BrandLogo({ className = '', decorative = false, tagline = brand.tagline, variant = 'full' }: BrandLogoProps) {
  const classNames = ['brand-logo', `brand-logo--${variant}`, className].filter(Boolean).join(' ');
  const logoId = useId().replace(/:/g, '');
  const skyId = `${logoId}-sky`;
  const leafId = `${logoId}-leaf`;
  const veinId = `${logoId}-vein`;
  const glowId = `${logoId}-glow`;
  const shadowId = `${logoId}-shadow`;

  return (
    <div
      className={classNames}
      dir="rtl"
      {...(decorative ? { 'aria-hidden': true } : { 'aria-label': brand.accessibilityLabel, role: 'img' })}
    >
      <svg className="brand-logo__mark" viewBox="0 0 128 128" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={skyId} x1="12" y1="8" x2="118" y2="122" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#6659D4" />
            <stop offset=".54" stopColor="#4338A8" />
            <stop offset="1" stopColor="#2A236F" />
          </linearGradient>
          <linearGradient id={leafId} x1="34" y1="27" x2="92" y2="102" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#B9F1DE" />
            <stop offset=".52" stopColor="#63D3B1" />
            <stop offset="1" stopColor="#32A98C" />
          </linearGradient>
          <linearGradient id={veinId} x1="51" y1="38" x2="78" y2="94" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFF9EE" />
            <stop offset="1" stopColor="#FFE7A2" />
          </linearGradient>
          <radialGradient id={glowId} cx="0" cy="0" r="1" gradientTransform="translate(34 28) rotate(46) scale(36)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFD45A" stopOpacity=".54" />
            <stop offset="1" stopColor="#FFD45A" stopOpacity="0" />
          </radialGradient>
          <filter id={shadowId} x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#17134A" floodOpacity=".32" />
          </filter>
        </defs>

        <rect width="128" height="128" rx="32" fill={`url(#${skyId})`} />
        <circle cx="34" cy="28" r="34" fill={`url(#${glowId})`} />
        <path d="M14 101C32 86 44 84 57 89c18 7 37-1 57-23" fill="none" stroke="#786DE0" strokeWidth="2" strokeLinecap="round" opacity=".7" />
        <path d="M97 19c10 9 15 19 16 32" fill="none" stroke="#A39AF0" strokeWidth="3" strokeLinecap="round" opacity=".5" />
        <g filter={`url(#${shadowId})`}>
          <path d="M64 22C38 29 27 50 34 75c6 22 22 31 31 34 15-7 29-23 30-44 1-22-11-37-31-43Z" fill="#FF796B" opacity=".72" transform="translate(3 2)" />
          <path d="M64 21C39 28 28 49 34 73c5 21 20 31 30 35 16-8 29-23 30-44 1-22-11-37-30-43Z" fill={`url(#${leafId})`} />
          <path d="M64 99c-1-19 0-33 1-46M65 64C53 56 48 46 47 36M65 64c12-8 18-18 18-29" fill="none" stroke={`url(#${veinId})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M42 55c5-2 8-6 10-12M83 54c-5-2-8-6-10-11M45 75c5-2 8-5 10-10M81 74c-5-2-8-5-10-10" fill="none" stroke="#E7FFF5" strokeWidth="2.5" strokeLinecap="round" opacity=".9" />
        </g>
        <circle cx="65" cy="28" r="6" fill="#FFD45A" />
        <path d="m100 24 2.4 5.6 6 1-4.6 4 1.4 6-5.2-3.1-5.2 3.1 1.4-6-4.6-4 6-1 2.4-5.6Z" fill="#FFD45A" />
        <circle cx="103" cy="76" r="4" fill="#FFE7A2" />
      </svg>

      {variant === 'full' ? (
        <span className="brand-logo__text">
          <strong>{brand.hebrewName}</strong>
          <span>{tagline}</span>
        </span>
      ) : null}
    </div>
  );
}
