import { Metadata } from "next";
import { FC, ReactElement } from "react";

import ChangePasswordLayout from "./_layout";

export const metadata: Metadata = {
  title: "Change Password",
};

const ChangePasswordPage: FC = (): ReactElement => <ChangePasswordLayout />;

export default ChangePasswordPage;
