import { redirect } from "next/navigation";
import { ReactElement } from "react";

import { getAllSession } from "@/src/utils/server/session";

import { Main } from "./main";

export const LoginModules = async (): Promise<ReactElement> => {
  const session = await getAllSession();

  if (session?.user?.status) {
    redirect("/");
  }

  return <Main />;
};
