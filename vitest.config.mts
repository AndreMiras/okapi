import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^server-only$/,
        replacement: fileURLToPath(
          new URL("./tests/fixtures/server-only.ts", import.meta.url),
        ),
      },
    ],
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    unstubEnvs: true,
    coverage: {
      provider: "v8",
      include: [
        "lib/**/*.ts",
        "app/api/auth/login/route.ts",
        "app/**/attendance/actions.ts",
      ],
      exclude: ["lib/mykids/types.ts"],
      reporter: ["text", "lcov", "cobertura"],
    },
  },
});
