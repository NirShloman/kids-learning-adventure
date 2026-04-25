import { useId } from 'react';

interface BrandLogoProps {
  className?: string;
  decorative?: boolean;
  tagline?: string;
  variant?: 'full' | 'mark';
}

export function BrandLogo({ className = '', decorative = false, tagline = 'הרפתקת משחקים בעברית', variant = 'full' }: BrandLogoProps) {
  const classNames = ['brand-logo', `brand-logo--${variant}`, className].filter(Boolean).join(' ');
  const logoId = useId().replace(/:/g, '');
  const skyId = `${logoId}-sky`;
  const bookId = `${logoId}-book`;
  const shadowId = `${logoId}-shadow`;

  return (
    <div
      className={classNames}
      dir="rtl"
      {...(decorative ? { 'aria-hidden': true } : { 'aria-label': 'לומדים בכיף', role: 'img' })}
    >
      <svg className="brand-logo__mark" viewBox="0 0 128 128" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={skyId} x1="16" y1="10" x2="112" y2="118" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffcf70" />
            <stop offset=".42" stopColor="#69d7cb" />
            <stop offset=".72" stopColor="#ff7fa7" />
            <stop offset="1" stopColor="#8b7cff" />
          </linearGradient>
          <linearGradient id={bookId} x1="28" y1="64" x2="101" y2="98" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#fff5c9" />
          </linearGradient>
          <filter id={shadowId} x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="9" stdDeviation="7" floodColor="#21324f" floodOpacity=".2" />
          </filter>
        </defs>

        <rect width="128" height="128" rx="32" fill={`url(#${skyId})`} />
        <path d="M21 40c20-18 66-18 86 0" fill="none" stroke="#fff6cc" strokeWidth="11" strokeLinecap="round" opacity=".92" />
        <path d="M29 45c15-12 55-12 70 0" fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" opacity=".78" />

        <g filter={`url(#${shadowId})`}>
          <path d="M26 68c13-8 26-7 38 3v32c-12-9-25-10-38-3V68Z" fill={`url(#${bookId})`} />
          <path d="M102 68c-13-8-26-7-38 3v32c12-9 25-10 38-3V68Z" fill="#ffffff" />
          <path d="M64 71v32" stroke="#65b9c7" strokeWidth="3" strokeLinecap="round" />
          <path d="M35 78c7-3 14-2 21 2M35 88c7-3 14-2 21 2M72 80c7-4 14-4 21-1M72 90c7-4 14-4 21-1" stroke="#8a7be8" strokeWidth="3" strokeLinecap="round" opacity=".72" />
        </g>

        <circle cx="34" cy="31" r="10" fill="#fff7cb" />
        <circle cx="98" cy="34" r="8" fill="#ffffff" opacity=".88" />
        <path d="m92 19 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1 3-7Z" fill="#fff36d" stroke="#ffffff" strokeWidth="2" />

        <text x="64" y="63" textAnchor="middle" fontFamily="Rubik, Arial, sans-serif" fontSize="43" fontWeight="900" fill="#21324f">א</text>
        <text x="63" y="116" textAnchor="middle" fontFamily="Rubik, Arial, sans-serif" fontSize="18" fontWeight="900" fill="#21324f">123</text>
      </svg>

      {variant === 'full' ? (
        <span className="brand-logo__text">
          <strong>לומדים בכיף</strong>
          <span>{tagline}</span>
        </span>
      ) : null}
    </div>
  );
}
