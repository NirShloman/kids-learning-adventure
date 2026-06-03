import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getFirebaseApp } from './firebase';

let initialized = false;

export function initializeOptionalAppCheck(): void {
  if (initialized) return;

  const app = getFirebaseApp();
  const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
  if (!app || !siteKey) return;

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true
  });
  initialized = true;
}
