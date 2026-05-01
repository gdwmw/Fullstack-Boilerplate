import { defineConfig, globalIgnores } from "eslint/config";

import { baseConfig } from "./base.js";

export const elysiaConfig = defineConfig([
  ...baseConfig,
  globalIgnores(["prisma/**", "src/generated/**"]),
  {
    files: ["**/.prettierrc.js", "**/.commitlintrc.cjs"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        exports: "readonly",
        module: "readonly",
        process: "readonly",
        require: "readonly",
      },
    },
  },
]);
