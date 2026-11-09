import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  outputDir: "test-results",
  use: {
    baseURL: "http://localhost:4173/family-hub/",
    launchOptions: {
      // Hard network cut-off for the whole browser (including websockets, which
      // page.route can't intercept): the tests must never read or write the live
      // Firestore project. The app falls back to built-in default data offline.
      args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1"],
    },
  },
  webServer: {
    command: "npx vite build && npx vite preview --port 4173 --strictPort",
    url: "http://localhost:4173/family-hub/",
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
