import { PropsWithChildren, ReactNode } from 'react';
import { AppVersion } from '../common/AppVersion';
import { BrandLogo } from '../common/BrandLogo';

interface AppShellProps {
  title: string;
  subtitle: string;
  rightSlot?: ReactNode;
}

export function AppShell({ title, subtitle, rightSlot, children }: PropsWithChildren<AppShellProps>) {
  return (
    <div className="app-shell">
      <header className="hero-card">
        <div className="hero-card__content">
          <div className="hero-card__brand-row">
            <BrandLogo variant="mark" className="hero-card__logo-mark" decorative />
            <span className="hero-card__eyebrow">אפליקציית למידה לילדים</span>
          </div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <AppVersion />
        </div>
        <div className="hero-card__side">
          {rightSlot}
          <BrandLogo className="hero-card__side-logo" tagline="משחקי למידה בעברית" decorative />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
