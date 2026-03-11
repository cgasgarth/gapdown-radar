import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 120000,
  outputDir: "test-results",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "bun run --cwd apps/api dev",
      cwd: "..",
      url: "http://localhost:4001/api/health",
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: "bun run --cwd apps/web dev -- --host localhost",
      cwd: "..",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
