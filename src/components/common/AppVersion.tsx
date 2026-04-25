import { APP_EDITION, APP_VERSION } from '../../services/versionService';

export function AppVersion() {
  return <span className="app-version" aria-label={`גרסת אפליקציה ${APP_VERSION}`}>{APP_EDITION} · גרסה {APP_VERSION}</span>;
}
