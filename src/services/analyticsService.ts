import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { Age, Difficulty, GameId } from '../types';
import { getFirebaseApp } from './firebase';

type AnalyticsEvent =
  | 'app_opened'
  | 'auth_ready'
  | 'game_started'
  | 'game_completed'
  | 'difficulty_changed'
  | 'age_changed'
  | 'parent_dashboard_opened'
  | 'question_bank_loaded'
  | 'question_bank_cache_hit'
  | 'question_bank_cache_miss'
  | 'firestore_sync_success'
  | 'firestore_sync_failed';

interface AnalyticsParams {
  gameId?: GameId;
  age?: Age;
  difficulty?: Difficulty;
  score?: number;
  total?: number;
  stars?: number;
}

let analyticsPromise: Promise<ReturnType<typeof getAnalytics> | null> | null = null;

async function getOptionalAnalytics() {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((supported) => (supported ? getAnalytics(app) : null))
      .catch(() => null);
  }

  return analyticsPromise;
}

export function trackEvent(eventName: AnalyticsEvent, params: AnalyticsParams = {}): void {
  getOptionalAnalytics()
    .then((analytics) => {
      if (!analytics) return;
      logEvent(analytics, eventName, params);
    })
    .catch(() => {
      // Analytics is optional and must never block the app.
    });
}
