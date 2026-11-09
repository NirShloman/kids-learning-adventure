import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerServiceWorker } from './services/pwaService';
import { initializeLocalDataStore, localPersistence } from './services/localDataStore';
import { initializePlatformRuntime, platformRuntime } from './services/platformRuntime';
import { AppErrorBoundary, PersistenceGuard, RecoveryScreen } from './components/common/AppRecovery';
import '@fontsource-variable/heebo';
import './styles.css';
import './intelligent-ui.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);
function showInitializationFailure() {
  root.render(<RecoveryScreen storage={localPersistence.getStatus().failed} onRetry={() => {
    root.render(<RecoveryScreen busy onRetry={() => undefined} />);
    void localPersistence.retry().then(bootstrap, showInitializationFailure);
  }} />);
}
async function bootstrap() {
  try {
    await initializePlatformRuntime();
    await initializeLocalDataStore();
    const pilotConfigured = !platformRuntime.native && import.meta.env.VITE_PILOT_ENABLED === '1';
    const RootApp = pilotConfigured ? (await import('./pilot/PilotApp')).default : App;
    root.render(<AppErrorBoundary><PersistenceGuard>{pilotConfigured ? <RootApp /> : <React.StrictMode><RootApp /></React.StrictMode>}</PersistenceGuard></AppErrorBoundary>);
    registerServiceWorker();
  } catch (error) {
    if (import.meta.env.DEV || import.meta.env.MODE === 'pilot-test') console.error('Bootstrap failed', error);
    showInitializationFailure();
  }
}

void bootstrap();
