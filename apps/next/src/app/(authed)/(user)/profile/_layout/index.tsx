import { dehydrate, QueryClient } from "@tanstack/react-query";
import { ReactElement } from "react";

import { GETMe } from "@/src/utils";

import { Main } from "./modules";

const ProfileLayout = async (): Promise<ReactElement> => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryFn: async () => {
      const res = await GETMe();
      return res.data;
    },
    queryKey: ["me"],
  });

  const dehydratedState = dehydrate(queryClient);

  return <Main dehydratedState={dehydratedState} />;
};

export default ProfileLayout;
