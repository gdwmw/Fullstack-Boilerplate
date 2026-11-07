import { Metadata } from "next";
import { FC, ReactElement } from "react";

import { ChangePasswordModules } from "./_modules";

export const metadata: Metadata = {
  title: "Change Password",
};

const ChangePasswordPage: FC = (): ReactElement => <ChangePasswordModules />;

export default ChangePasswordPage;
