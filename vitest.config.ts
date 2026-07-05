import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      JWT_ACCESS_SECRET: "test_secret_access_key_for_testing_only",
      JWT_REFRESH_SECRET: "test_secret_refresh_key_for_testing_only",
      JWT_ACCESS_TTL: "15d",
      JWT_REFRESH_TTL: "30d",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});