import { dehydrate, QueryClient } from "@tanstack/react-query";
import { ReactElement } from "react";

import { GETAuditLogs } from "@/src/utils";

import { Main } from "./modules";

const AuditLayout = async (): Promise<ReactElement> => {
  const limit = 50;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryFn: async () => {
      const res = await GETAuditLogs({ limit, page: 1 });
      return res.data;
    },
    queryKey: ["audit-logs", { dateTime: undefined, level: undefined, limit, method: undefined, page: 1, path: undefined }],
  });

  const dehydratedState = dehydrate(queryClient);

  return <Main dehydratedState={dehydratedState} limit={limit} />;
};

export default AuditLayout;
