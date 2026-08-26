import { brand } from '../../config/brand';

interface BrandLogoProps {
  className?: string;
  decorative?: boolean;
  tagline?: string;
  variant?: 'full' | 'mark';
}

export function BrandLogo({ className = '', decorative = false, tagline = brand.tagline, variant = 'full' }: BrandLogoProps) {
  const classNames = ['brand-logo', `brand-logo--${variant}`, className].filter(Boolean).join(' ');
  const source = variant === 'full'
    ? '/assets/brand/yadaale-logo-horizontal.webp'
    : '/assets/brand/yadaale-mark.webp';

  return (
    <div
      className={classNames}
      dir="rtl"
      {...(decorative ? { 'aria-hidden': true } : { 'aria-label': brand.accessibilityLabel, role: 'img' })}
    >
      <img
        className={variant === 'full' ? 'brand-logo__wordmark' : 'brand-logo__mark'}
        src={source}
        alt=""
        aria-hidden="true"
        draggable={false}
      />

      {variant === 'full' && tagline ? (
        <span className="brand-logo__text">
          <span>{tagline}</span>
        </span>
      ) : null}
    </div>
  );
}
