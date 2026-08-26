// Service Worker registration for PWA functionality
import { platformRuntime } from './platformRuntime';

async function unregisterDevelopmentServiceWorkers(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  }
}

export async function registerServiceWorker(): Promise<void> {
  if (platformRuntime.native) return;
  if (!('serviceWorker' in navigator)) {
    return;
  }

  if (import.meta.env.DEV) {
    try {
      await unregisterDevelopmentServiceWorkers();
      console.info('Development Service Workers and caches cleared.');
    } catch (error) {
      console.error('Development Service Worker cleanup failed:', error);
    }
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
    await registration.update();
    const worker = registration.active ?? registration.waiting ?? registration.installing;
    worker?.postMessage({ type: 'WARM_AUDIO_CACHE' });
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}
