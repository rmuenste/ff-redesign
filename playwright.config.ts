import { defineConfig, devices } from "@playwright/test";

// Browser-level layout checks against the production build (e2e/). The unit
// suite (vitest, src/**/*.test.ts) never needs a browser; this does, so it is a
// separate command: `npm run build && npm run test:e2e`.
//
// The preview server is started here so the spec can assume it. Locally an
// already-running `vite preview` on 4173 is reused; in CI it is always fresh.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx vite preview --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});
