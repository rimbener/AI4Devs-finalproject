const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  // 'list' prints pass/fail inline; the HTML reporter is kept but never auto-opens
  // (its default on-failure open starts a blocking report server that hangs non-interactive runs).
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm web',
    url: 'http://localhost:8081',
    // Never silently reuse a running `pnpm web`: its bundle inlines the EXPO_PUBLIC_* vars
    // it was started with, so a stale server can point the suite at the HOSTED Supabase
    // project instead of the local stack e2e-prepare-supabase.sh just reset. With reuse off,
    // Playwright fails fast when :8081 is taken. Opt back in (e.g. a trusted local-stack
    // server during test:e2e:ui iteration) with PLAYWRIGHT_REUSE_SERVER=1.
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === '1',
    timeout: 120 * 1000,
  },
});
