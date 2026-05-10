"use client";

import { logTemplate, parseDurationToMs } from "@repo/utils";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { FC, PropsWithChildren, ReactElement, useEffect } from "react";

import { clientEnv } from "@/src/environments/env.client";
import { POSTRefresh } from "@/src/utils";

type TTimeoutId = ReturnType<typeof globalThis.setTimeout>;

const ACCESS_TOKEN_EXPIRES_IN = clientEnv.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRES_IN;
const REFRESH_BUFFER_MS = clientEnv.NEXT_PUBLIC_REFRESH_BUFFER_MS;

const AUTH_REFRESH_LOCK_KEY = "auth:refresh-lock";
const AUTH_REFRESH_SYNC_KEY = "auth:refresh-sync";
const MAX_TIMEOUT_MS = 2_147_483_647;
const REFRESH_LOCK_TTL_MS = parseDurationToMs("15s");
const REFRESH_SYNC_DELAY_MS = parseDurationToMs("2s");

const logStorageWarning = (scope: "lock" | "sync", error: unknown) => {
  if (!(process.env.NODE_ENV === "development" || clientEnv.NEXT_PUBLIC_DEBUG_MODE)) {
    return;
  }

  logTemplate.WARN(`localStorage is unavailable: ${String(error)}`, `auth-refresh/${scope}`);
};

const scheduleAt = (runAt: number, callback: () => void): (() => void) => {
  let cancelled = false;
  let timeoutId: TTimeoutId | undefined;

  const tick = () => {
    if (cancelled) {
      return;
    }

    const remaining = runAt - Date.now();

    if (remaining <= 0) {
      callback();
      return;
    }

    timeoutId = globalThis.setTimeout(tick, Math.min(remaining, MAX_TIMEOUT_MS));
  };

  tick();

  return () => {
    cancelled = true;
    if (timeoutId !== undefined) {
      globalThis.clearTimeout(timeoutId);
    }
  };
};

const tryAcquireFallbackLock = (): (() => void) | null => {
  try {
    const now = Date.now();
    const current = globalThis.localStorage.getItem(AUTH_REFRESH_LOCK_KEY);

    if (current) {
      const parsed = Number(current);
      if (!Number.isNaN(parsed) && parsed > now) {
        return null;
      }
    }

    const expiresAt = now + REFRESH_LOCK_TTL_MS;
    globalThis.localStorage.setItem(AUTH_REFRESH_LOCK_KEY, String(expiresAt));

    if (globalThis.localStorage.getItem(AUTH_REFRESH_LOCK_KEY) !== String(expiresAt)) {
      return null;
    }

    return () => {
      if (globalThis.localStorage.getItem(AUTH_REFRESH_LOCK_KEY) === String(expiresAt)) {
        globalThis.localStorage.removeItem(AUTH_REFRESH_LOCK_KEY);
      }
    };
  } catch (error) {
    logStorageWarning("lock", error);
    return null;
  }
};

const hasWebLocks = (): boolean => typeof globalThis.navigator !== "undefined" && typeof globalThis.navigator.locks?.request === "function";

const withRefreshLock = async (run: () => Promise<void>): Promise<"locked" | "ran"> => {
  if (hasWebLocks()) {
    let outcome: "locked" | "ran" = "locked";
    try {
      await globalThis.navigator.locks.request(AUTH_REFRESH_LOCK_KEY, { ifAvailable: true }, async (lock) => {
        if (!lock) {
          return;
        }
        outcome = "ran";
        await run();
      });
      return outcome;
    } catch (error) {
      logStorageWarning("lock", error);
    }
  }

  const release = tryAcquireFallbackLock();
  if (!release) {
    return "locked";
  }
  try {
    await run();
  } finally {
    release();
  }
  return "ran";
};

const notifyRefreshSync = () => {
  try {
    globalThis.localStorage.setItem(AUTH_REFRESH_SYNC_KEY, `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  } catch (error) {
    logStorageWarning("sync", error);
  }
};

const RefreshSessionGuard: FC = (): null | ReactElement => {
  const { data, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const sessionExpiresAt = data?.user?.sessionExpiresAt;

    if (!sessionExpiresAt) {
      return;
    }

    if (Date.now() >= sessionExpiresAt) {
      signOut();
      return;
    }

    return scheduleAt(sessionExpiresAt, () => {
      signOut();
    });
  }, [data?.user?.sessionExpiresAt, status]);

  return null;
};

const AccessTokenRefreshGuard: FC = (): null | ReactElement => {
  const { data, status, update } = useSession();

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_REFRESH_SYNC_KEY) {
        return;
      }

      void update();
    };

    globalThis.addEventListener("storage", onStorage);
    return () => {
      globalThis.removeEventListener("storage", onStorage);
    };
  }, [status, update]);

  const accessTokenExpiresAt = data?.user?.accessTokenExpiresAt;
  const sessionExpiresAt = data?.user?.sessionExpiresAt;
  const sessionStartedAt = data?.user?.sessionStartedAt;

  useEffect(() => {
    if (status !== "authenticated" || !accessTokenExpiresAt) {
      return;
    }

    let syncTimeoutId: TTimeoutId | undefined;
    const refreshAt = accessTokenExpiresAt - parseDurationToMs(REFRESH_BUFFER_MS);

    const runRefresh = async () => {
      try {
        const res = await POSTRefresh();
        const newAccessToken = res?.data?.accessToken;

        if (!newAccessToken) {
          signOut();
          return;
        }

        const newExpiresAt = Date.now() + parseDurationToMs(ACCESS_TOKEN_EXPIRES_IN);

        await update({
          user: {
            accessToken: newAccessToken,
            accessTokenExpiresAt: newExpiresAt,
            sessionExpiresAt,
            sessionStartedAt,
          },
        });
        notifyRefreshSync();
      } catch {
        signOut();
      }
    };

    const refresh = async () => {
      const outcome = await withRefreshLock(runRefresh);

      if (outcome === "locked") {
        syncTimeoutId = globalThis.setTimeout(() => {
          void update();
        }, REFRESH_SYNC_DELAY_MS);
      }
    };

    const disposeTimer = scheduleAt(refreshAt, () => {
      void refresh();
    });

    return () => {
      disposeTimer();
      if (syncTimeoutId !== undefined) {
        globalThis.clearTimeout(syncTimeoutId);
      }
    };
  }, [accessTokenExpiresAt, sessionExpiresAt, sessionStartedAt, status, update]);

  return null;
};

type T = Readonly<PropsWithChildren>;

export const NextAuthProvider: FC<T> = (props): ReactElement => (
  <SessionProvider>
    <RefreshSessionGuard />
    <AccessTokenRefreshGuard />
    {props.children}
  </SessionProvider>
);
