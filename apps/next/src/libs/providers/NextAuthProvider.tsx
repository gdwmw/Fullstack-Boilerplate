"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { FC, PropsWithChildren, ReactElement, useEffect } from "react";

type T = Readonly<PropsWithChildren>;

const SESSION_ERRORS = new Set(["refresh-access-token-error", "session-expired-error"]);

const RefreshSessionGuard: FC = (): null | ReactElement => {
  const session = useSession();

  useEffect(() => {
    if (session.status !== "authenticated") {
      return;
    }

    if (session.data?.user?.error && SESSION_ERRORS.has(session.data.user.error)) {
      signOut();
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
  }, [session.data?.user?.error, session.data?.user?.sessionExpiresAt, session.status]);

  return null;
};

export const NextAuthProvider: FC<T> = (props): ReactElement => (
  <SessionProvider>
    <RefreshSessionGuard />
    {props.children}
  </SessionProvider>
);
