import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ReactElement } from "react";

import { GETAuditArchives } from "@/src/utils";

import { Main } from "./modules";

const AuditLayout = async (): Promise<ReactElement> => {
  const defaultPageSize = 50;

  const queryClient = new QueryClient();

  await queryClient
    .prefetchQuery({
      queryFn: async () => {
        const res = await GETAuditArchives();
        return res.data;
      },
      queryKey: ["audit-archives"],
    })
    .catch((error: unknown) => {
      if (!(isAxiosError(error) && error.response?.status === 401)) {
        throw error;
      }
    });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Main defaultPageSize={defaultPageSize} />
    </HydrationBoundary>
  );
};

export default AuditLayout;
