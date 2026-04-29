import { defineConfig } from "eslint/config";
import { config as baseConfig } from "../eslint-config/base.js";

export const eslintConfig = defineConfig([...baseConfig]);
