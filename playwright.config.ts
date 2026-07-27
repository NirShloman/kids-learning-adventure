import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './tests',
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
    }
  ],
  webServer: {
    command: 'node scripts/e2e-vite.mjs',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
