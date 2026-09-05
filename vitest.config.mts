import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    unstubEnvs: true,
    coverage: {
      provider: "v8",
      include: [
        "lib/env.ts",
        "lib/mykids/errors.ts",
        "lib/mykids/selectors.ts",
      ],
      reporter: ["text", "lcov", "cobertura"],
    },
  },
});
