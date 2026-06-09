import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  outputDir: ".omo/evidence/test-results",
  webServer: {
    command: "pnpm build && pnpm start",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [
    {
      name: "auth",
      testDir: "./tests/e2e",
      testMatch: "auth.setup.ts",
    },
    {
      name: "chromium",
      dependencies: ["auth"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".omo/evidence/.auth/admin.json",
      },
    },
    {
      name: "mobile",
      dependencies: ["auth"],
      use: {
        ...devices["iPhone 13"],
        storageState: ".omo/evidence/.auth/admin.json",
      },
    },
  ],
});
