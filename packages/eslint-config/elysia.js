import eslint from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import { config as baseConfig } from "../eslint-config/base.js";

export const eslintConfig = defineConfig([
  ...baseConfig,
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  perfectionist.configs["recommended-alphabetical"],
  eslintPluginPrettierRecommended,
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
  {
    rules: {
      "prettier/prettier": "warn",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "arrow-body-style": ["warn", "as-needed"],
      "no-unused-expressions": "off",
      "perfectionist/sort-imports": [
        "warn",
        {
          customGroups: [],
          environment: "node",
          fallbackSort: { type: "unsorted" },
          groups: [
            "type-import",
            ["value-builtin", "value-external"],
            "type-internal",
            "value-internal",
            ["type-parent", "type-sibling", "type-index"],
            ["value-parent", "value-sibling", "value-index"],
            "ts-equals-import",
            "unknown",
          ],
          ignoreCase: true,
          internalPattern: ["^~/.+", "^@/.+"],
          maxLineLength: undefined,
          newlinesBetween: 1,
          newlinesInside: 0,
          order: "asc",
          partitionByComment: false,
          partitionByNewLine: false,
          specialCharacters: "keep",
          type: "alphabetical",
        },
      ],
      "perfectionist/sort-modules": "off",
      "perfectionist/sort-objects": [
        "warn",
        {
          customGroups: [
            {
              elementNamePattern: "^id$",
              groupName: "id",
            },
          ],
          fallbackSort: { type: "unsorted" },
          groups: ["id", "member"],
          ignoreCase: true,
          order: "asc",
          partitionByComment: false,
          partitionByNewLine: false,
          specialCharacters: "keep",
          type: "alphabetical",
        },
      ],
    },
  },
]);
