import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
// import onlyWarn from "eslint-plugin-only-warn";
import perfectionist from "eslint-plugin-perfectionist";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */

export const baseConfig = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  perfectionist.configs["recommended-alphabetical"],
  eslintPluginPrettierRecommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
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
  // {
  //   plugins: {
  //     onlyWarn,
  //   },
  // },
  {
    ignores: ["dist/**"],
  },
];
