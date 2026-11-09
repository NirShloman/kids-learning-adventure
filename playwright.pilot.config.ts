import { defineConfig, devices } from '@playwright/test';
const baseURL='http://127.0.0.1:4188';
export default defineConfig({
  testDir:'./tests/pilot', timeout:120000, workers:1, fullyParallel:true,
  expect:{timeout:20000},
  outputDir:process.env.PLAYWRIGHT_OUTPUT_DIR || 'qa-results/pilot', reporter:[['list'],['json',{outputFile:process.env.PLAYWRIGHT_JSON_OUTPUT_NAME || 'qa-reports/pilot.json'}]],
  use:{baseURL,serviceWorkers:'allow',trace:'retain-on-failure',screenshot:'only-on-failure'},
  projects: ['chrome','firefox','edge'].flatMap(browser => [
    {name:`pilot-${browser}-1366`,use:{...(browser==='firefox'?devices['Desktop Firefox']:devices['Desktop Chrome']),...(browser==='edge'?{channel:'msedge'}:browser==='chrome'?{channel:'chrome'}:{}),viewport:{width:1366,height:768}}},
    {name:`pilot-${browser}-1920`,use:{...(browser==='firefox'?devices['Desktop Firefox']:devices['Desktop Chrome']),...(browser==='edge'?{channel:'msedge'}:browser==='chrome'?{channel:'chrome'}:{}),viewport:{width:1920,height:1080}}}
  ]),
  webServer:{command:'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4188 --outDir dist-pilot',url:baseURL,reuseExistingServer:!process.env.CI},
});
