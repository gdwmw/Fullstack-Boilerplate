"use client";

import { Power } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { FC, ReactElement, useState } from "react";

import loadingBlack from "@/public/assets/animations/loadings/Loading-B.svg";
import loadingWhite from "@/public/assets/animations/loadings/Loading-W.svg";
import { ExampleA, IExampleA } from "@/src/components/elements/example/A/ExampleA";
import { POSTLogout } from "@/src/utils/api/authentication/logout";

export const LogoutButton: FC<IExampleA> = ({ ...props }): ReactElement => {
  const { systemTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await POSTLogout();
    signOut();
  };

  return (
    <ExampleA onClick={handleLogout} {...props} disabled={loading}>
      {loading ? <Image alt="Loading..." height={18} src={systemTheme === "dark" ? loadingWhite : loadingBlack} width={18} /> : <Power size={18} />}
    </ExampleA>
  );
};
