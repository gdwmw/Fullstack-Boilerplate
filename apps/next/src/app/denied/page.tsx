import { Metadata } from "next";
import { FC, ReactElement } from "react";

export const metadata: Metadata = {
  title: "Denied",
};

const DeniedPage: FC = (): ReactElement => (
  <main className="flex h-dvh flex-col items-center justify-center px-5">
    <h1 className="text-center text-2xl font-semibold dark:text-white">You are not allowed to access this page.</h1>
  </main>
);

export default DeniedPage;
