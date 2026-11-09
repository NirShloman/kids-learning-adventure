import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import packageJson from './package.json';

export default defineConfig(({mode}) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const pilot = env.VITE_PILOT_ENABLED === '1';
  const emulators = env.VITE_PILOT_EMULATORS === '1' && ['development','pilot-test'].includes(mode);
  if (pilot && !/^[a-z0-9-]{6,63}$/.test(env.VITE_PILOT_PROJECT_ID ?? '')) throw new Error('Pilot requires a valid, separate Firebase project ID');
  if (pilot && ['VITE_PILOT_API_KEY','VITE_PILOT_AUTH_DOMAIN','VITE_PILOT_APP_ID'].some(key=>!env[key]?.trim())) throw new Error('Complete the Firebase Web app configuration before building the pilot');
  if (pilot && mode === 'production' && env.VITE_PILOT_EMULATORS === '1') throw new Error('Emulators cannot be enabled in a production release');
  return {
  plugins: [
    react(),
    { name: 'pilot-connect-policy', transformIndexHtml(html) {
      if (!pilot) return html;
      const endpoints = emulators ? 'http://127.0.0.1:9098 http://127.0.0.1:8088 http://127.0.0.1:5008' : `https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://europe-west1-${env.VITE_PILOT_PROJECT_ID}.cloudfunctions.net`;
      return html.replace("connect-src 'self'", `connect-src 'self' ${endpoints}`);
    } },
    {
      name: 'local-narration-playback-manifest',
      enforce: 'pre',
      apply: 'build',
      transform(source, id) {
        if (!id.replaceAll('\\', '/').endsWith('/src/assets/generatedNarrationManifest.json')) return;
        // Cloud archive/provenance metadata remains in the source manifest.
        // The player only needs the bundled path, keeping startup local and small.
        const manifest = JSON.parse(source);
        return JSON.stringify({ ...manifest, entries: Object.fromEntries(
          Object.entries(manifest.entries).map(([text, asset]) => [text, { localPath: (asset as { localPath: string }).localPath }])
        ) });
      }
    }
  ],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    // The production app is same-origin. Preview CORS adds Vary: Origin,
    // making precached modules miss when reloaded offline as module requests.
    cors: false
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    outDir: 'dist'
  }
  };
});
