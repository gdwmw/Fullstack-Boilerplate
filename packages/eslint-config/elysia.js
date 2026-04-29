import { defineConfig, globalIgnores } from "eslint/config";
import { config as baseConfig } from "../eslint-config/base.js";

export const eslintConfig = defineConfig([
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
