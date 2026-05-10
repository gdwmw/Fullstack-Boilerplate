import { defineConfig } from "eslint/config";

import { baseConfig } from "./base.js";

export const utilsConfig = defineConfig([...baseConfig]);
