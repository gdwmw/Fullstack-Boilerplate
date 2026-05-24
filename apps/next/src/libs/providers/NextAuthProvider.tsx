"use client";

import { parseDurationToMs } from "@repo/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { FC, PropsWithChildren, ReactElement, useEffect } from "react";

import { clientEnv } from "@/src/environments/env.client";
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
  const queryClient = useQueryClient();

  const refreshTokenMutation = useMutation({
    mutationFn: (refreshToken: string) => POSTRefresh(refreshToken),
    onError: () => {
      signOut();
    },
  });

  useEffect(() => {
    if (session.status !== "authenticated") {
      return;
    }

    const accessTokenExpiresAt = session.data?.user?.accessTokenExpiresAt;

    if (!accessTokenExpiresAt) {
      return;
    }

    const refreshAt = accessTokenExpiresAt - parseDurationToMs(REFRESH_BUFFER_MS);
    const timeUntilRefresh = refreshAt - Date.now();

    const handleRefresh = async () => {
      try {
        const refreshToken = session.data?.user?.refreshToken;

        if (!refreshToken) {
          signOut();
          return;
        }

        const res = await refreshTokenMutation.mutateAsync(refreshToken);
        const refreshedUser = res?.data;
        const newAccessToken = refreshedUser?.accessToken;
        const newRefreshToken = refreshedUser?.refreshToken;

        if (!refreshedUser || !newAccessToken || !newRefreshToken) {
          signOut();
          return;
        }

        const newExpiresAt = Date.now() + parseDurationToMs(ACCESS_TOKEN_EXPIRES_IN);

        await session.update({
          user: {
            ...session.data?.user,
            ...refreshedUser,
            accessToken: newAccessToken,
            accessTokenExpiresAt: newExpiresAt,
            refreshToken: newRefreshToken,
            sessionExpiresAt: session.data?.user?.sessionExpiresAt,
            sessionStartedAt: session.data?.user?.sessionStartedAt,
            status: session.data?.user?.status ?? "authenticated",
          },
        });

        queryClient.invalidateQueries();
      } catch {
        signOut();
      }
    };

    if (timeUntilRefresh <= 0) {
      handleRefresh();
      return;
    }

    const timeoutId = globalThis.setTimeout(handleRefresh, timeUntilRefresh);

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
