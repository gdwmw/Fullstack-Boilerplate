"use client";

import { parseDurationToMs } from "@repo/utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FC, PropsWithChildren, useState } from "react";

export const ReactQueryProvider: FC<Readonly<PropsWithChildren>> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: parseDurationToMs("5m"),
            retry: (count, error) => {
              const status = (error as { status?: number }).status;
              return status !== undefined && status >= 500 && count < 4;
            },
            staleTime: parseDurationToMs("60s"),
          },
        },
      }),
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
