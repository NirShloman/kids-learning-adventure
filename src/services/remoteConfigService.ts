import { fetchAndActivate, getRemoteConfig, getValue, RemoteConfig } from 'firebase/remote-config';
import { getFirebaseApp } from './firebase';

const defaults = {
  quiz_questions_age_3: 8,
  quiz_questions_default: 10,
  matching_pairs_age_3: 4,
  feature_parent_dashboard: true,
  feature_cloud_sync: true,
  min_app_version: '1.0.0',
  parent_system_message: ''
};

let remoteConfig: RemoteConfig | null = null;
let loadPromise: Promise<void> | null = null;

function getOptionalRemoteConfig(): RemoteConfig | null {
  const app = getFirebaseApp();
  if (!app || typeof window === 'undefined') return null;

  if (!remoteConfig) {
    remoteConfig = getRemoteConfig(app);
    remoteConfig.defaultConfig = defaults;
    remoteConfig.settings.minimumFetchIntervalMillis = import.meta.env.DEV ? 60_000 : 3_600_000;
  }

  return remoteConfig;
}

export function loadRemoteConfig(): Promise<void> {
  const config = getOptionalRemoteConfig();
  if (!config) return Promise.resolve();
  if (!loadPromise) loadPromise = fetchAndActivate(config).then(() => undefined).catch(() => undefined);
  return loadPromise;
}

export function getRemoteBoolean(key: keyof typeof defaults): boolean {
  const config = getOptionalRemoteConfig();
  if (!config) return Boolean(defaults[key]);
  return getValue(config, key).asBoolean();
}

export function getRemoteNumber(key: keyof typeof defaults): number {
  const config = getOptionalRemoteConfig();
  if (!config) return Number(defaults[key]);
  return getValue(config, key).asNumber();
}

export function getRemoteString(key: keyof typeof defaults): string {
  const config = getOptionalRemoteConfig();
  if (!config) return String(defaults[key]);
  return getValue(config, key).asString();
}
