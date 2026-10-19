import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerServiceWorker } from './services/pwaService';
import { initializeLocalDataStore, localPersistence } from './services/localDataStore';
import { initializePlatformRuntime } from './services/platformRuntime';
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
    root.render(<React.StrictMode><AppErrorBoundary><PersistenceGuard><App /></PersistenceGuard></AppErrorBoundary></React.StrictMode>);
    registerServiceWorker();
  } catch {
    showInitializationFailure();
  }
}

void bootstrap();
