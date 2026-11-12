import { parseDurationToMs } from "@repo/utils";

import { clientEnv } from "../environments/env.client";

export const isAccessTokenFresh = (expiresAt: number): boolean => expiresAt > Date.now() + parseDurationToMs(clientEnv.NEXT_PUBLIC_REFRESH_BUFFER_MS);
