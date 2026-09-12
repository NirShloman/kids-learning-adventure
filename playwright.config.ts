import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './tests',
  metadata: { hostPlatform: process.platform },
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 90_000,
  expect: {
    timeout: 8_000
  },
  reporter: [
    ['list'],
    ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME || 'test-results/results.json' }],
    ['html', { open: 'never' }]
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000
  },
  projects: [
    {
      name: 'adventure-recordings',
      testMatch: /adventure-recordings\.spec\.ts/,
      use: { ...devices['Pixel 5'], viewport: { width: 393, height: 851 } }
    },
    {
      name: 'adventure-touch',
      testMatch: /adventure-touch\.spec\.ts/,
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'adventure-performance',
      testMatch: /adventure-performance\.spec\.ts/,
      use: { ...devices['Pixel 5'], viewport: {width:393,height:851} }
    },
    {
      name: 'adventure-offline',
      testMatch: /adventure-offline\.spec\.ts/,
      timeout: 180_000,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4179' }
    },
    {
      name: 'adventure-content',
      testMatch: /adventure-(content|glyphs)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'local-chromium',
      testMatch: /.*\.local\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'local-firefox',
      testMatch: /.*\.local\.spec\.ts/,
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'local-webkit',
      testMatch: /.*\.local\.spec\.ts/,
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'mobile-chrome',
      testMatch: /.*\.local\.spec\.ts/,
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 }
      }
    },
    {
      name: 'mobile-safari',
      testMatch: /.*\.local\.spec\.ts/,
      use: { ...devices['iPhone 12'] }
    },
    {
      name: 'mobile-android-tablet',
      testMatch: /.*\.local\.spec\.ts/,
      use: { ...devices['Pixel 5'], viewport: { width: 1280, height: 800 } }
    },
    {
      name: 'mobile-ipad',
      testMatch: /.*\.local\.spec\.ts/,
      use: { ...devices['iPad Pro 11'] }
    }
  ],
  webServer: {
    command: process.env.E2E_PREVIEW === '1' ? 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4179' : 'node scripts/e2e-vite.mjs',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
