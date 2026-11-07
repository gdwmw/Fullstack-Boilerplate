"use client";

import { parseDurationToMs } from "@repo/utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FC, PropsWithChildren, ReactElement, useState } from "react";

type T = Readonly<PropsWithChildren>;

export const ReactQueryProvider: FC<T> = (props): ReactElement => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: parseDurationToMs("5m"),
            refetchOnReconnect: "always",
            refetchOnWindowFocus: "always",
            retry: (count, error) => {
              const status = (error as { status?: number }).status;
              return status !== undefined && status >= 500 && count < 4;
            },
            staleTime: parseDurationToMs("60s"),
          },
        },
      }),
  );
  return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>;
};
