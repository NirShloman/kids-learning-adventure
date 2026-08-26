import { PropsWithChildren, ReactNode } from 'react';
import { AppVersion } from '../common/AppVersion';
import { BrandLogo } from '../common/BrandLogo';
import { brand } from '../../config/brand';

interface AppShellProps {
  title: string;
  subtitle: string;
  rightSlot?: ReactNode;
  compact?: boolean;
}

export function AppShell({ title, subtitle, rightSlot, compact = false, children }: PropsWithChildren<AppShellProps>) {
  return (
    <div className={`app-shell ${compact ? 'app-shell--compact' : ''}`}>
      <header className="hero-card">
        <div className="hero-card__identity">
          <BrandLogo variant="mark" className="hero-card__logo-mark" decorative />
          <div className="hero-card__content">
            <span className="hero-card__eyebrow">{brand.hebrewName}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="hero-card__side">
          {rightSlot}
          <AppVersion />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
