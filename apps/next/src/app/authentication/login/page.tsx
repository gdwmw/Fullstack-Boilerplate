import { Metadata } from "next";
import { FC, ReactElement } from "react";

import { LoginModules } from "./_src/modules";

export const metadata: Metadata = {
  title: "Login",
};

const LoginPage: FC = (): ReactElement => <LoginModules />;

export default LoginPage;
