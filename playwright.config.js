// Real rendering with local copies of the pinned libraries and an empty
// basemap style: CI exercises our figures without depending on third parties.
import { defineConfig, devices } from '@playwright/test';

// Optional locally installed browser; CI always installs Playwright's release.
const chromiumLaunch = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
  : {};

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  reporter: [[process.env.CI ? 'github' : 'list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:8765/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
  },
  webServer: {
    command: 'python -m http.server 8765 --bind 127.0.0.1',
    url: 'http://127.0.0.1:8765/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1100, height: 700 }, launchOptions: chromiumLaunch } },
    { name: 'phone', use: { ...devices['Pixel 7'], launchOptions: chromiumLaunch } },
    // A small cross-engine subset covers DOM/SVG exports and embedding.
    { name: 'firefox', testMatch: '**/compatibility.spec.js', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testMatch: '**/compatibility.spec.js', use: { ...devices['Desktop Safari'] } },
  ],
});
