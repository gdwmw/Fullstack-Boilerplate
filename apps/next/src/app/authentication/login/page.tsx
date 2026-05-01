import { Metadata } from "next";
import { FC, ReactElement } from "react";

import LoginLayout from "./_layout";

export const metadata: Metadata = {
  title: "Login",
};

const LoginPage: FC = (): ReactElement => <LoginLayout />;

export default LoginPage;
