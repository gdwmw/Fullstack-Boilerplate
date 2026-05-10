"use client";

import { parseDurationToMs } from "@repo/utils";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { FC, PropsWithChildren, ReactElement, useEffect } from "react";

import { clientEnv } from "@/src/environments";
import { POSTRefresh } from "@/src/utils";

type T = Readonly<PropsWithChildren>;

const ACCESS_TOKEN_EXPIRES_IN = clientEnv.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRES_IN;
const REFRESH_BUFFER_MS = clientEnv.NEXT_PUBLIC_REFRESH_BUFFER_MS;

const RefreshSessionGuard: FC = (): null | ReactElement => {
  const session = useSession();

  useEffect(() => {
    if (session.status !== "authenticated") {
      return;
    }

    const sessionExpiresAt = session.data?.user?.sessionExpiresAt;

    if (!sessionExpiresAt) {
      return;
    }

    if (Date.now() >= sessionExpiresAt) {
      signOut();
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      signOut();
    }, sessionExpiresAt - Date.now());

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status]);

  return null;
};

const AccessTokenRefreshGuard: FC = (): null | ReactElement => {
  const session = useSession();

  useEffect(() => {
    if (session.status !== "authenticated") {
      return;
    }

    const accessTokenExpiresAt = session.data?.user?.accessTokenExpiresAt;

    if (!accessTokenExpiresAt) {
      return;
    }

    const refreshAt = accessTokenExpiresAt - parseDurationToMs(REFRESH_BUFFER_MS);
    const delay = refreshAt - Date.now();

    const refresh = async () => {
      try {
        const res = await POSTRefresh();
        const newAccessToken = res?.data?.accessToken;

        if (!newAccessToken) {
          signOut();
          return;
        }

        const newExpiresAt = Date.now() + parseDurationToMs(ACCESS_TOKEN_EXPIRES_IN);

        await session.update({
          user: {
            ...session.data?.user,
            accessToken: newAccessToken,
            accessTokenExpiresAt: newExpiresAt,
            sessionExpiresAt: session.data?.user?.sessionExpiresAt,
            sessionStartedAt: session.data?.user?.sessionStartedAt,
          },
        });
      } catch {
        signOut();
      }
    };

    if (delay <= 0) {
      refresh();
      return;
    }

    const timeoutId = globalThis.setTimeout(refresh, delay);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status]);

  return null;
};

export const NextAuthProvider: FC<T> = (props): ReactElement => (
  <SessionProvider>
    <RefreshSessionGuard />
    <AccessTokenRefreshGuard />
    {props.children}
  </SessionProvider>
);
