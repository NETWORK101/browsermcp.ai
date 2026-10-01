import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Most suites drive a real Chromium; a cold launch on a busy CI runner can exceed 5s.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
