import { PropsWithChildren, ReactNode } from 'react';
import { AppVersion } from '../common/AppVersion';

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
          <span className="hero-card__eyebrow">אפליקציית למידה לילדים</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <AppVersion />
        </div>
        <div className="hero-card__side">
          {rightSlot}
          <div className="hero-card__mascot" aria-hidden="true">🌈🦄</div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
