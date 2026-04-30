import pluginQuery from "@tanstack/eslint-plugin-query";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import jest from "eslint-plugin-jest";
import reactPlugin from "eslint-plugin-react";
import storybook from "eslint-plugin-storybook";
import { defineConfig, globalIgnores } from "eslint/config";
import { config as baseConfig } from "../eslint-config/base.js";

export const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  reactPlugin.configs.flat.recommended,
  ...pluginQuery.configs["flat/recommended"],
  ...storybook.configs["flat/recommended"],
  jest.configs["flat/recommended"],
  ...baseConfig,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".commitlintrc.cjs",
    "node_modules/**",
    "!.storybook",
    "storybook-static/**",
    "coverage/**",
    "dist/**",
  ]),
  {
    plugins: {
      "better-tailwindcss": eslintPluginBetterTailwindcss,
    },
    rules: {
      // "better-tailwindcss/enforce-consistent-class-order": ["warn", { order: "official" }],
      "@tanstack/query/mutation-property-order": "off",
      "better-tailwindcss/enforce-consistent-important-position": ["warn", { position: "recommended" }],
      "better-tailwindcss/enforce-consistent-variable-syntax": ["warn", { syntax: "shorthand" }],
      "better-tailwindcss/enforce-shorthand-classes": ["warn"],
      "better-tailwindcss/no-deprecated-classes": ["warn"],
      "better-tailwindcss/no-duplicate-classes": ["warn"],
      "better-tailwindcss/no-unknown-classes": ["warn", { ignore: ["font-inter", "font-geistMono", "font-geistSans", "font-roboto"] }],
      "better-tailwindcss/no-unnecessary-whitespace": ["warn"],
      curly: ["warn"],
      "react/display-name": "warn",
      "react/jsx-fragments": "warn",
      "react/jsx-no-undef": "warn",
      "react/jsx-no-useless-fragment": "warn",
      "react/no-children-prop": "warn",
      "react/no-danger": "warn",
      // "react/no-multi-comp": "warn",
      "react/no-unstable-nested-components": "warn",
      "react/no-unused-prop-types": "warn",
      // "react/prefer-read-only-props": "warn",
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      "better-tailwindcss": {
        callees: ["twm"],
        entryPoint: "src/app/global.css",
        variables: [".*TWM"],
      },
    },
  },
]);
