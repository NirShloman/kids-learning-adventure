// Service Worker registration for PWA functionality

const LOCAL_DEV_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

async function unregisterDevelopmentServiceWorkers(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  }
}

export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  if (LOCAL_DEV_HOSTS.has(window.location.hostname)) {
    try {
      await unregisterDevelopmentServiceWorkers();
      console.info('Development Service Workers and caches cleared.');
    } catch (error) {
      console.error('Development Service Worker cleanup failed:', error);
    }
    return;
  }

  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}
