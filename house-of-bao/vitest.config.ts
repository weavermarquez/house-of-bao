import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    pool: "threads",
    include: [
      "src/**/*.test.{js,ts,jsx,tsx}",
      "src/logic/tests/**/*.test.{js,ts,jsx,tsx}",
    ],
  },
});
