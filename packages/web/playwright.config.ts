import { defineConfig, devices } from '@playwright/test';

const API_PORT = 8787;
const WEB_PORT = 5173;

/** E2E: levanta api (DB aislada) + web y corre el flujo completo en Chromium. */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter @bv/api dev',
      port: API_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { DATABASE_PATH: './data/e2e.db', NODE_ENV: 'development' },
    },
    {
      command: 'pnpm --filter @bv/web dev',
      port: WEB_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
