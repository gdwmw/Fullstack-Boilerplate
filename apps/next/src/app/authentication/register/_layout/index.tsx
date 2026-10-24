import { redirect } from "next/navigation";
import { FC, ReactElement } from "react";

import { getAllSession } from "@/src/utils/server/session";

import { Main } from "./modules/main";

const RegisterLayout: FC = async (): Promise<ReactElement> => {
  const session = await getAllSession();

  if (session?.user?.status) {
    redirect("/");
  }

  return <Main />;
};

export default RegisterLayout;
