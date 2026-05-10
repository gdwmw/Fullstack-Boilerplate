import { dehydrate, QueryClient } from "@tanstack/react-query";
import { ReactElement } from "react";

import { GETAuditArchives } from "@/src/utils";

import { Main } from "./modules";

const AuditLayout = async (): Promise<ReactElement> => {
  const defaultPageSize = 50;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryFn: async () => {
      const res = await GETAuditArchives();
      return res.data;
    },
    queryKey: ["audit-archives"],
  });

  const dehydratedState = dehydrate(queryClient);

  return <Main defaultPageSize={defaultPageSize} dehydratedState={dehydratedState} />;
};

export default AuditLayout;
