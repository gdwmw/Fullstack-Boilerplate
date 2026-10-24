import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { ReactElement } from "react";

import { GETMe } from "@/src/utils/api/authentication/me";
import { isAccessTokenFresh } from "@/src/utils/isAccessTokenFresh";
import { getAllSession } from "@/src/utils/server/session";

import { Main } from "./modules/main";

const ProfileLayout = async (): Promise<ReactElement> => {
  const queryClient = new QueryClient();
  const session = await getAllSession();

  if (isAccessTokenFresh(session?.user?.accessTokenExpiresAt ?? 0)) {
    await queryClient.query({
      queryFn: async () => {
        const res = await GETMe();
        return res.data;
      },
      queryKey: ["me"],
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Main />
    </HydrationBoundary>
  );
};

export default ProfileLayout;
