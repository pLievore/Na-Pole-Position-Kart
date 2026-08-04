import { defineConfig, devices } from "@playwright/test";

const emCI = Boolean(process.env.CI);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const iniciarServidor = process.env.PLAYWRIGHT_SKIP_WEB_SERVER !== "1";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./node_modules/.cache/playwright/test-results",
  fullyParallel: true,
  forbidOnly: emCI,
  retries: emCI ? 2 : 0,
  workers: emCI ? 1 : undefined,
  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: "./node_modules/.cache/playwright-report",
        open: "never",
      },
    ],
  ],
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    colorScheme: "dark",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: iniciarServidor
    ? {
        command: process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ?? "pnpm dev",
        url: process.env.PLAYWRIGHT_WEB_SERVER_URL ?? baseURL,
        reuseExistingServer: !emCI,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
      }
    : undefined,
});
