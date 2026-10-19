import { Component, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { localPersistence } from '../../services/localDataStore';

export function RecoveryScreen({ storage = false, busy = false, onRetry }: {
  storage?: boolean; busy?: boolean; onRetry: () => void;
}) {
  return <main className="app-recovery" dir="rtl" role="alert" aria-busy={busy}>
    <section className="app-recovery__card">
      <h1>{storage ? 'צריך עזרה ממבוגר כדי לשמור' : 'משהו לא נטען כמו שצריך'}</h1>
      <p>{storage ? 'השמירה לא הושלמה. השאירו את האפליקציה פתוחה ונסו שוב. אם המכשיר מלא, אפשר לפנות מקום באפליקציות אחרות.' : 'אפשר לנסות שוב. הנתונים הקיימים לא נמחקים.'}</p>
      <button className="button" type="button" autoFocus disabled={busy} onClick={onRetry}>
        {busy ? 'מנסים שוב…' : 'ניסיון נוסף'}
      </button>
    </section>
  </main>;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; retrying: boolean }> {
  state = { failed: false, retrying: false };
  static getDerivedStateFromError() { return { failed: true }; }
  private retry = async () => {
    this.setState({ retrying: true });
    try {
      await localPersistence.retry();
      window.location.reload();
    } catch { this.setState({ retrying: false }); }
  };
  render() {
    return this.state.failed
      ? <RecoveryScreen storage={localPersistence.getStatus().failed} busy={this.state.retrying} onRetry={() => void this.retry()} />
      : this.props.children;
  }
}

export function PersistenceGuard({ children }: { children: ReactNode }) {
  const status = useSyncExternalStore(localPersistence.subscribe, localPersistence.getStatus);
  const [retrying, setRetrying] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const blocked = status.failed || retrying;
  useEffect(() => {
    content.current?.toggleAttribute('inert', blocked);
    if (blocked) window.dispatchEvent(new CustomEvent('lomdim:app-state', { detail: { isActive: false } }));
    else window.dispatchEvent(new CustomEvent('lomdim:app-state', { detail: { isActive: true } }));
  }, [blocked]);
  useEffect(() => {
    const keepUnsavedGameOpen = (event: Event) => {
      if (blocked || status.pending > 0) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    window.addEventListener('lomdim:native-back', keepUnsavedGameOpen, true);
    return () => window.removeEventListener('lomdim:native-back', keepUnsavedGameOpen, true);
  }, [blocked, status.pending]);
  async function retry() {
    setRetrying(true);
    try { await localPersistence.retry(); }
    catch { /* The retained queue and visible error allow another retry. */ }
    finally { setRetrying(false); }
  }
  return <>
    <div ref={content} className="persistence-content" aria-hidden={blocked || undefined} aria-busy={status.pending > 0}>{children}</div>
    {!blocked && status.pending > 0 ? <span className="persistence-saving" role="status">שומרים את ההתקדמות…</span> : null}
    {blocked ? <RecoveryScreen storage busy={retrying} onRetry={() => void retry()} /> : null}
  </>;
}
