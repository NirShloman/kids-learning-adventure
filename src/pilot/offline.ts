declare const __APP_VERSION__: string;
const marker = 'olamia-pilot-offline';
export async function offlineReady(): Promise<boolean> {
  if (!('caches' in window)) return false;
  const response = await caches.match(`/${marker}`);
  return !!response && (await response.text()) === __APP_VERSION__;
}
export async function preparePilotOffline(): Promise<void> {
  if (!('serviceWorker' in navigator) || !navigator.onLine) throw new Error('הכנה ללא רשת דורשת חיבור ודפדפן תומך.');
  const registration = await navigator.serviceWorker.ready;
  const worker = navigator.serviceWorker.controller ?? registration.active;
  if (!worker) throw new Error('יש לרענן את העמוד לפני ההכנה.');
  const cacheName = await new Promise<string>((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); reject(new Error('ההכנה נמשכה זמן רב. בדקו את הרשת ונסו שוב.')); }, 600000);
    channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); event.data?.ok && typeof event.data.cacheName === 'string' ? resolve(event.data.cacheName) : reject(new Error('חלק מהקבצים לא נשמרו. נסו שוב.')); };
    worker.postMessage({ type: 'PREPARE_PILOT_OFFLINE' }, [channel.port2]);
  });
  // Keep the readiness marker in the same cache as the shell, so worker upgrades invalidate it.
  if (!(await caches.keys()).includes(cacheName)) throw new Error('אחסון המשחק אינו זמין.');
  await (await caches.open(cacheName)).put(`/${marker}`, new Response(__APP_VERSION__));
}
