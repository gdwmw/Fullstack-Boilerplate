import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { ReactElement } from "react";

import { GETMe } from "@/src/utils/api/authentication/me";

import { Main } from "./modules/main";

const ProfileLayout = async (): Promise<ReactElement> => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryFn: async () => {
      const res = await GETMe();
      return res.data;
    },
    queryKey: ["me"],
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Main />
    </HydrationBoundary>
  );
};

export default ProfileLayout;
