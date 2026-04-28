import { FC, ReactElement } from "react";

import { GETMe, IMeResponse } from "@/src/utils";

import { Main } from "./modules";

const ProfileLayout: FC = async (): Promise<ReactElement> => {
  let user: IMeResponse | null = null;

  try {
    const res = await GETMe();
    user = res.data;
  } catch {
    user = null;
  }

  return <Main user={user} />;
};

export default ProfileLayout;
