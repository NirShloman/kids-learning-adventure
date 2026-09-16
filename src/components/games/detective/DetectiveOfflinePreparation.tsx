import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { narrationAssetForText } from '../../../assets/narrationManifest';
import type { DetectiveItem, DetectiveRound } from '../../../types/detective.types';

export function DetectiveOfflinePreparation({ items, round }: { items: DetectiveItem[]; round: DetectiveRound }) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'ready' | 'error'>('idle');
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  if (!import.meta.env.PROD || Capacitor.isNativePlatform()) return null;
  async function save() {
    setStatus('saving');
    try {
      if (!('serviceWorker' in navigator)) throw new Error('Offline storage unavailable');
      const registration = await navigator.serviceWorker.ready;
      const worker = navigator.serviceWorker.controller ?? registration.active;
      if (!worker) throw new Error('Offline storage not active');
      const texts = new Set([
        'הופכים שני קלפים ומחפשים זוג.', 'בוחרים כרטיס מכל צד ומחברים זוג.',
        'הכרטיסים שונים. נזכור אותם וננסה שוב.',
        'סיימנו את התעלומה וגילינו תמונה חדשה. כל הכבוד!',
        'לשחק שוב', 'חזרה לתפריט המשחקים',
      ]);
      for (const item of items.filter(item => item.ages.includes(round.age) && item.difficulty === round.difficulty)) {
        for (const text of [item.prompt, item.hint, item.explanation, item.leftVisual?.label, item.rightVisual?.label, ...(item.options ?? []).map(option => option.label)]) {
          if (text) texts.add(text);
        }
      }
      const urls = new Set<string>();
      for (const text of texts) {
        const asset = narrationAssetForText(text);
        if (!asset) throw new Error('Required narration is not packaged');
        urls.add(asset.localPath);
      }
      // Include the menu and entry recordings used to reach this activity.
      for (const entry of performance.getEntriesByType('resource')) {
        const url = new URL(entry.name);
        if (url.origin === location.origin && url.pathname.startsWith('/assets/audio/narration/')) urls.add(url.pathname);
      }
      await new Promise<void>((resolve, reject) => {
        const channel = new MessageChannel();
        const timer = setTimeout(() => { channel.port1.close(); reject(new Error('Offline preparation timed out')); }, 120_000);
        channel.port1.onmessage = event => {
          clearTimeout(timer); channel.port1.close();
          event.data?.ok ? resolve() : reject(new Error('Offline preparation incomplete'));
        };
        worker.postMessage({ type: 'PREPARE_ADVENTURE_OFFLINE', urls: [...urls] }, [channel.port2]);
      });
      if (active.current) setStatus('ready');
    } catch { if (active.current) setStatus('error'); }
  }
  return <div className="detective-offline">
    <button type="button" className="detective-tool" onClick={save} disabled={status === 'saving' || status === 'ready'}>
      {status === 'saving' ? 'שומרים את המשחק…' : status === 'ready' ? 'המשחק מוכן גם ללא רשת' : 'שמירה למשחק ללא רשת'}
    </button>
    <p role="status">{status === 'ready' ? 'הפעילויות והקריינות לגיל ולרמה שבחרתם נשמרו במכשיר.' : status === 'error' ? 'השמירה לא הושלמה. אפשר לנסות שוב בחיבור לרשת.' : ''}</p>
  </div>;
}
