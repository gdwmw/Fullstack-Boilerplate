"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { FC, PropsWithChildren, ReactElement, useEffect } from "react";

type T = Readonly<PropsWithChildren>;

const RefreshSessionGuard: FC = (): null | ReactElement => {
  const session = useSession();

  useEffect(() => {
    if (session.status !== "authenticated") {
      return;
    }

    if (session.data?.user?.error === "refresh-access-token-error") {
      signOut();
    }
  }, [session.data?.user?.error, session.status]);

  return null;
};

export const NextAuthProvider: FC<T> = (props): ReactElement => (
  <SessionProvider>
    <RefreshSessionGuard />
    {props.children}
  </SessionProvider>
);
