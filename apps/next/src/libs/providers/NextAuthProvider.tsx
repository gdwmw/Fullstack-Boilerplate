"use client";

import { parseDurationToMs } from "@repo/utils";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { FC, PropsWithChildren, ReactElement, useEffect } from "react";

import { POSTRefresh } from "@/src/utils";

type T = Readonly<PropsWithChildren>;

const ACCESS_TOKEN_EXPIRES_IN = process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_BUFFER_MS = process.env.NEXT_PUBLIC_REFRESH_BUFFER_MS || "15s";

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

    const timeoutId = window.setTimeout(() => {
      signOut();
    }, sessionExpiresAt - Date.now());

    return () => {
      window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line
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

    const timeoutId = window.setTimeout(refresh, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line
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
