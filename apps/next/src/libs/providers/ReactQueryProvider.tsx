"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FC, PropsWithChildren, useState } from "react";

export const ReactQueryProvider: FC<Readonly<PropsWithChildren>> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 5 * 60 * 1000,
            retry: (count, error) =>
              (error as { status?: number }).status !== undefined && (error as { status?: number }).status! >= 500 && count < 2,
            staleTime: 60_000,
          },
        },
      }),
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
