// Smoke tests for the interactive figures. Every page is static, so a plain
// Python HTTP server is enough; the tests only need the DOM, not the tiles.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  // D3 and MapLibre load from a CDN on every page, so give slow networks room.
  expect: { timeout: 20_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:8765/',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'python -m http.server 8765 --bind 127.0.0.1',
    url: 'http://127.0.0.1:8765/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1100, height: 700 } } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
});
