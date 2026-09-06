import { defineConfig, devices } from "@playwright/test";

const appUrl = "http://127.0.0.1:3100";
const upstreamUrl = "http://127.0.0.1:4100";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: ".next/playwright",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL: appUrl,
    trace: "retain-on-first-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node tests/e2e/upstream-fixture.mjs",
      url: `${upstreamUrl}/health`,
      reuseExistingServer: false,
    },
    {
      command: "npm run start -- --hostname 127.0.0.1 --port 3100",
      url: `${appUrl}/login`,
      reuseExistingServer: false,
      env: {
        SESSION_SECRET: "playwright-session-secret-at-least-32-characters",
        MYKIDS_API_BASE_URL: `${upstreamUrl}/api/`,
      },
    },
  ],
});
