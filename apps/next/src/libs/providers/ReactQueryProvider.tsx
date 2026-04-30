"use client";

import { type DehydratedState, HydrationBoundary, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FC, PropsWithChildren, useState } from "react";

type T = Readonly<{ dehydratedState?: DehydratedState } & PropsWithChildren>;

export const ReactQueryProvider: FC<T> = ({ children, dehydratedState }) => {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
    </QueryClientProvider>
  );
};
