"use client";

import { Power } from "lucide-react";
import { signOut } from "next-auth/react";
import { FC, ReactElement } from "react";

import { POSTLogout } from "@/src/utils";

import { ExampleA, IExampleA } from "..";

export const LogoutButton: FC<IExampleA> = ({ ...props }): ReactElement => {
  const handleLogout = async () => {
    await POSTLogout();
    signOut();
  };

  return (
    <ExampleA onClick={handleLogout} {...props}>
      <Power size={18} />
    </ExampleA>
  );
};
