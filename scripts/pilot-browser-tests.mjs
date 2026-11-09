import { spawnSync } from 'node:child_process';
const env={...process.env,VITE_PILOT_ENABLED:'1',VITE_PILOT_API_KEY:'demo-key',VITE_PILOT_PROJECT_ID:'demo-olamia-pilot',VITE_PILOT_AUTH_DOMAIN:'demo-olamia-pilot.firebaseapp.com',VITE_PILOT_APP_ID:'demo-app',VITE_PILOT_EMULATORS:'1'};
for(const args of [ ['node_modules/vite/bin/vite.js','build','--mode','pilot-test','--outDir','dist-pilot'], ['scripts/finalize-service-worker.mjs','dist-pilot'], ['node_modules/@playwright/test/cli.js','test','--config','playwright.pilot.config.ts',...process.argv.slice(2)] ]) {
  const result=spawnSync(process.execPath,args,{env,stdio:'inherit'}); if(result.status!==0) process.exit(result.status??1);
}
