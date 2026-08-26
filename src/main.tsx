import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerServiceWorker } from './services/pwaService';
import { initializeLocalDataStore } from './services/localDataStore';
import { initializePlatformRuntime } from './services/platformRuntime';
import '@fontsource/rubik/hebrew-400.css';
import '@fontsource/rubik/hebrew-500.css';
import '@fontsource/rubik/hebrew-600.css';
import '@fontsource/rubik/hebrew-700.css';
import '@fontsource/rubik/hebrew-800.css';
import '@fontsource/rubik/hebrew-900.css';
import './styles.css';

async function bootstrap() {
  await initializePlatformRuntime();
  await initializeLocalDataStore();
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  registerServiceWorker();
}

void bootstrap();
