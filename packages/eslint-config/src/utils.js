import { defineConfig } from "eslint/config";

import { baseConfig } from "../../eslint-config/src/base.js";

export const utilsConfig = defineConfig([...baseConfig]);
