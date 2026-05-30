import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load test-specific environment variables
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

/**
 * Playwright configuration for the Toyota Incentive Portal E2E test suite.
 *
 * Designed for sequential execution against a shared Supabase database,
 * running across desktop Chromium and mobile Pixel 5 viewports.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,

  retries: process.env.CI ? 1 : 0,
  workers: 1, // Sequential — tests share database state

  reporter: "html",

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],

  /* Run the local dev server before all tests if not already running */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
