import { Metadata } from "next";
import { FC, ReactElement } from "react";

import RegisterLayout from "./_layout";

export const metadata: Metadata = {
  title: "Register",
};

const RegisterPage: FC = (): ReactElement => <RegisterLayout />;

export default RegisterPage;
